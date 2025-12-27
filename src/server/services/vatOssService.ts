// @ts-nocheck
import { prisma } from '../db';
import { withContext } from '../tenant/als';
import { RequestContext } from '../tenant/context';
import { writeAuditEvent } from '../audit/auditService';

export class VatOssService {
  async buildVatTransactions(ctx: RequestContext) {
    return withContext(ctx, async () => {
      const invoices = await prisma.invoice.findMany({ where: { tenantId: ctx.tenantId } });
      for (const inv of invoices) {
        await prisma.vatTransaction.upsert({
          where: { tenantId_id: { tenantId: ctx.tenantId, id: `vat-${inv.id}` } },
          update: {},
          create: {
            id: `vat-${inv.id}`,
            tenantId: ctx.tenantId,
            invoiceId: inv.id,
            jurisdictionId: 'EU',
            netCents: inv.subtotalCents,
            vatCents: inv.taxCents,
            rateBps: 2100,
            category: 'GOODS',
          },
        });
      }
    });
  }

  async generateOssReport(ctx: RequestContext, periodStart: Date, periodEnd: Date) {
    return withContext(ctx, async () => {
      const txCount = await prisma.vatTransaction.count({ where: { tenantId: ctx.tenantId } });
      const report = await prisma.reportExport.create({
        data: {
          tenantId: ctx.tenantId,
          type: 'OSS_VAT',
          periodStart,
          periodEnd,
          status: 'COMPLETED',
          outputUrl: `/files/reports/oss-${Date.now()}.csv`,
          meta: { txCount },
        },
      });
      await writeAuditEvent({
        tenantId: ctx.tenantId,
        actorUserId: ctx.userId ?? null,
        action: 'vat.report',
        resourceType: 'ReportExport',
        resourceId: report.id,
      });
      return report;
    });
  }
}
