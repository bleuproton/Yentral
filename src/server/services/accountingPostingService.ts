// @ts-nocheck
import { prisma } from '../db';
import { withContext } from '../tenant/als';
import { RequestContext } from '../tenant/context';
import { writeAuditEvent } from '../audit/auditService';

export class AccountingPostingService {
  async postInvoice(ctx: RequestContext, invoiceId: string) {
    return withContext(ctx, async () => {
      const invoice = await prisma.invoice.findUnique({ where: { tenantId_id: { tenantId: ctx.tenantId, id: invoiceId } } });
      if (!invoice) throw new Error('Invoice not found');
      const revenueAccount = await prisma.gLAccount.upsert({
        where: { tenantId_code: { tenantId: ctx.tenantId, code: '4000' } },
        update: {},
        create: { tenantId: ctx.tenantId, code: '4000', name: 'Revenue', type: 'REVENUE' },
      });
      const arAccount = await prisma.gLAccount.upsert({
        where: { tenantId_code: { tenantId: ctx.tenantId, code: '1100' } },
        update: {},
        create: { tenantId: ctx.tenantId, code: '1100', name: 'Accounts Receivable', type: 'ASSET' },
      });
      const entry = await prisma.journalEntry.create({
        data: {
          tenantId: ctx.tenantId,
          legalEntityId: invoice.legalEntityId,
          refType: 'INVOICE',
          refId: invoice.id,
        },
      });
      await prisma.journalLine.createMany({
        data: [
          {
            tenantId: ctx.tenantId,
            entryId: entry.id,
            accountId: arAccount.id,
            debitCents: invoice.totalCents,
            creditCents: 0,
            currency: invoice.currency,
          },
          {
            tenantId: ctx.tenantId,
            entryId: entry.id,
            accountId: revenueAccount.id,
            debitCents: 0,
            creditCents: invoice.totalCents,
            currency: invoice.currency,
          },
        ],
      });
      await prisma.invoice.updateMany({
        where: { tenantId: ctx.tenantId, id: invoice.id },
        data: { status: 'ISSUED' },
      });
      await writeAuditEvent({
        tenantId: ctx.tenantId,
        actorUserId: ctx.userId ?? null,
        action: 'accounting.post',
        resourceType: 'Invoice',
        resourceId: invoice.id,
        metadata: { entryId: entry.id },
      });
      return entry;
    });
  }
}
