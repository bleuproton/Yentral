// @ts-nocheck
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { jsonOk, parseJson } from '@/app/api/_utils';
import { AccountingExportService } from '@/modules/accounting/services/AccountingExportService';
import { assertAccountantAccess } from '@/modules/accounting/guard';

export const POST = tenantRoute(async ({ ctx, req }) => {
  const body = await parseJson(req);
  await assertAccountantAccess(ctx, body.legalEntityId);
  const service = new AccountingExportService();
  const job = await service.createReportExportJob(
    ctx,
    'journal',
    body.legalEntityId,
    new Date(body.from),
    new Date(body.to)
  );
  return jsonOk(job, 202);
});
