// @ts-nocheck
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { jsonOk, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { IntegrationRepo } from '@/server/repos/integrationRepo';
import { IntegrationConnectionCreateSchema } from '@/server/validators/integration';

export const GET = tenantRoute(async ({ ctx }) => {
  const repo = new IntegrationRepo();
  const connections = await repo.listConnections(ctx);
  return jsonOk(connections);
});

export const POST = tenantRoute(async ({ req, ctx }) => {
  requireWriteAccess(ctx, 'integration.write');
  const body = IntegrationConnectionCreateSchema.parse(await parseJson(req));
  const repo = new IntegrationRepo();
  const connection = await repo.createConnection(ctx, {
    connectorVersionId: body.connectorVersionId,
    name: body.name ?? null,
    region: body.region ?? null,
    status: body.status as any,
    config: body.config ?? null,
  } as any);
  return jsonOk(connection, 201);
});
