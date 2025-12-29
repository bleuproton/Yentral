import { AccountType, JournalSource, JournalStatus } from "@prisma/client";
import prisma from "@/lib/prisma";

export type JournalLineInput = {
  accountId: string;
  debitCents?: number;
  creditCents?: number;
  memo?: string;
  meta?: Record<string, unknown>;
};

export type JournalEntryInput = {
  tenantId: string;
  legalEntityId: string;
  periodId?: string | null;
  bookingDate: Date;
  currency?: string;
  source?: JournalSource | null;
  correlationId?: string | null;
  memo?: string | null;
  lines: JournalLineInput[];
};

export class JournalService {
  /**
   * Post a balanced journal entry (DRAFT -> POSTED). This is idempotent on correlationId.
   */
  async postEntry(input: JournalEntryInput) {
    const {
      tenantId,
      legalEntityId,
      periodId,
      bookingDate,
      currency = "USD",
      source = JournalSource.MANUAL,
      correlationId,
      memo,
      lines,
    } = input;

    if (!lines.length) throw new Error("JOURNAL_LINES_REQUIRED");

    const totals = lines.reduce(
      (agg, l) => {
        const debit = l.debitCents ?? 0;
        const credit = l.creditCents ?? 0;
        return { debit: agg.debit + debit, credit: agg.credit + credit };
      },
      { debit: 0, credit: 0 }
    );

    if (totals.debit !== totals.credit) throw new Error("JOURNAL_NOT_BALANCED");

    // Optional idempotency on correlationId
    if (correlationId) {
      const existing = await prisma.journalEntry.findFirst({
        where: { tenantId, correlationId },
        include: { lines: true },
      });
      if (existing) return existing;
    }

    // Basic validation: accounts active & belong to same tenant/entity
    const accountIds = Array.from(new Set(lines.map((l) => l.accountId)));
    const accounts = await prisma.account.findMany({
      where: { tenantId, legalEntityId, id: { in: accountIds }, isActive: true },
      select: { id: true, type: true },
    });
    if (accounts.length !== accountIds.length) throw new Error("ACCOUNT_NOT_FOUND_OR_INACTIVE");

    const entry = await prisma.$transaction(async (tx) => {
      const created = await tx.journalEntry.create({
        data: {
          tenantId,
          legalEntityId,
          periodId: periodId ?? null,
          bookingDate,
          status: JournalStatus.POSTED,
          source,
          currency,
          totalDebitCents: totals.debit,
          totalCreditCents: totals.credit,
          memo: memo ?? null,
          correlationId: correlationId ?? null,
        },
      });

      await tx.journalLine.createMany({
        data: lines.map((line) => ({
          tenantId,
          entryId: created.id,
          accountId: line.accountId,
          debitCents: line.debitCents ?? 0,
          creditCents: line.creditCents ?? 0,
          memo: line.memo ?? null,
          meta: line.meta ?? null,
        })),
      });

      return created;
    });

    return entry;
  }

  /**
   * List journals for a tenant/entity with optional filters.
   */
  async listEntries(params: {
    tenantId: string;
    legalEntityId?: string;
    periodId?: string;
    status?: JournalStatus;
    limit?: number;
    cursor?: string;
  }) {
    const { tenantId, legalEntityId, periodId, status, limit = 50, cursor } = params;

    return prisma.journalEntry.findMany({
      where: {
        tenantId,
        legalEntityId: legalEntityId ?? undefined,
        periodId: periodId ?? undefined,
        status: status ?? undefined,
      },
      orderBy: { bookingDate: "desc" },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      include: { lines: true },
    });
  }

  /**
   * Soft-void a journal by creating a VOID status (no reversal yet).
   */
  async voidEntry(tenantId: string, entryId: string, reason?: string) {
    const entry = await prisma.journalEntry.findFirst({ where: { tenantId, id: entryId } });
    if (!entry) throw new Error("JOURNAL_NOT_FOUND");
    if (entry.status === JournalStatus.VOID) return entry;

    return prisma.journalEntry.update({
      where: { tenantId_id: { tenantId, id: entryId } },
      data: { status: JournalStatus.VOID, memo: reason ? `${entry.memo ?? ""}\nVOID: ${reason}` : entry.memo },
    });
  }
}

export const journalService = new JournalService();
