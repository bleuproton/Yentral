import { withApi } from '@/server/http/withApi';
import { IntegrationService } from '@/server/services/integrationService';
import { tenantDb } from '@/server/db/tenantDb';
import { IntegrationCreateSchema } from '@/server/schemas/integration';
import { parseJson } from '@/server/validation/zod';
import { jsonOk, created } from '@/server/http/response';

export const GET = withApi(async (ctx) => {
  const service = new IntegrationService(tenantDb(ctx.tenantId), ctx.tenantId, ctx.actorUserId || '');
  const list = await service.listConnections();
  return jsonOk(list);
});

export const POST = withApi(async (ctx) => {
  const body = await parseJson(ctx.req, IntegrationCreateSchema);
  const service = new IntegrationService(tenantDb(ctx.tenantId), ctx.tenantId, ctx.actorUserId || '');
  const conn = await service.createConnection(body);
  return created(conn);
});
