// @ts-nocheck
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { jsonOk, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { AccountingPeriodService } from '@/modules/accounting/services/AccountingPeriodService';

export const GET = tenantRoute(async ({ ctx, req }) => {
  const search = req.nextUrl.searchParams;
  const legalEntityId = search.get('legalEntityId') || undefined;
  const service = new AccountingPeriodService();
  const items = await service.listPeriods(ctx, legalEntityId);
  return jsonOk(items);
});

export const POST = tenantRoute(async ({ ctx, req }) => {
  requireWriteAccess(ctx, 'accounting.write');
  const body = await parseJson(req);
  const service = new AccountingPeriodService();
  const period = await service.openPeriod(ctx, body.legalEntityId, new Date(body.startDate), new Date(body.endDate));
  return jsonOk(period, 201);
});
