// @ts-nocheck
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { jsonOk, requireWriteAccess } from '@/app/api/_utils';
import { AccountingPeriodService } from '@/modules/accounting/services/AccountingPeriodService';

export const POST = tenantRoute(async ({ ctx, params }) => {
  requireWriteAccess(ctx, 'accounting.write');
  const service = new AccountingPeriodService();
  const closed = await service.closePeriod(ctx, params.id);
  return jsonOk(closed);
});
