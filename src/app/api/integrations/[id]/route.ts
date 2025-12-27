// @ts-nocheck
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { jsonOk, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { IntegrationRepo } from '@/server/repos/integrationRepo';
import { IntegrationConnectionUpdateSchema } from '@/server/validators/integration';

export const GET = tenantRoute(async ({ ctx, params }) => {
  const repo = new IntegrationRepo();
  const connection = await repo.getConnection(ctx, params.id);
  return jsonOk(connection);
});

export const PATCH = tenantRoute(async ({ req, ctx, params }) => {
  requireWriteAccess(ctx, 'integration.write');
  const body = IntegrationConnectionUpdateSchema.parse(await parseJson(req));
  const repo = new IntegrationRepo();
  const updated = await repo.updateConnection(ctx, params.id, body as any);
  return jsonOk(updated);
});
