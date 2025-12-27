// @ts-nocheck
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { jsonOk, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { AccountantAccessService } from '@/modules/accounting/services/AccountantAccessService';

export const GET = tenantRoute(async ({ ctx }) => {
  const service = new AccountantAccessService();
  const rows = await service.listAccess(ctx);
  return jsonOk(rows);
});

export const POST = tenantRoute(async ({ ctx, req }) => {
  requireWriteAccess(ctx, 'accounting.write');
  const body = await parseJson(req);
  const service = new AccountantAccessService();
  const access = await service.grantAccess(ctx, body.userId, body.legalEntityId ?? null, body.permissions ?? {});
  return jsonOk(access, 201);
});
