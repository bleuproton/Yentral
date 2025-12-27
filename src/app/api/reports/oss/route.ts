// @ts-nocheck
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { jsonOk, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { VatOssService } from '@/server/services/vatOssService';

export const GET = tenantRoute(async ({ ctx }) => {
  const service = new VatOssService();
  await service.buildVatTransactions(ctx);
  const reports = await prisma.reportExport.findMany({ where: { tenantId: ctx.tenantId, type: 'OSS_VAT' } });
  return jsonOk(reports);
});

export const POST = tenantRoute(async ({ req, ctx }) => {
  requireWriteAccess(ctx, 'report.write');
  const body = await parseJson(req);
  const service = new VatOssService();
  await service.buildVatTransactions(ctx);
  const report = await service.generateOssReport(ctx, new Date(body.periodStart), new Date(body.periodEnd));
  return jsonOk(report, 201);
});
