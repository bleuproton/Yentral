// @ts-nocheck
import { prisma } from '@/server/db/prisma';
import { RequestContext } from '@/server/tenant/context';
import { withContext } from '@/server/tenant/als';

export class AccountingExportService {
  async exportJournalCsv(ctx: RequestContext, legalEntityId: string, from: Date, to: Date) {
    return withContext(ctx, async () => {
      const entries = await prisma.journalEntry.findMany({
        where: { tenantId: ctx.tenantId, legalEntityId, postedAt: { gte: from, lte: to } },
        include: { lines: true },
      });
      const rows = [['entryId', 'postedAt', 'accountId', 'debitCents', 'creditCents', 'currency']];
      for (const e of entries) {
        for (const l of e.lines) {
          rows.push([e.id, e.postedAt.toISOString(), l.accountId, l.debitCents, l.creditCents, l.currency].map(String));
        }
      }
      return rows.map((r) => r.join(',')).join('\n');
    });
  }

  async exportTrialBalanceCsv(ctx: RequestContext, legalEntityId: string, from: Date, to: Date) {
    // placeholder stub
    return withContext(ctx, async () => 'accountId,debit,credit\n');
  }

  async createReportExportJob(ctx: RequestContext, type: string, legalEntityId: string, from: Date, to: Date) {
    return withContext(ctx, async () => {
      return prisma.job.create({
        data: {
          tenantId: ctx.tenantId,
          type: 'accounting.report.export',
          payload: { type, legalEntityId, from, to },
          status: 'PENDING',
          maxAttempts: 3,
        },
      });
    });
  }
}
