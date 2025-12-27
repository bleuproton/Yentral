import { NextRequest } from 'next/server';
import { withApiContext } from '@/server/http/withApiContext';
import { jsonOk } from '@/server/http/response';
import { parseJson } from '@/server/http/validators';
import { IntegrationService } from '@/server/services/integrationService';

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string; connectionId: string } }
) {
  return withApiContext(req, params, async (ctx) => {
    const service = new IntegrationService(ctx.db, ctx.tenantId, ctx.actorUserId);
    const conn = await service.getConnection(params.connectionId);
    return jsonOk(conn);
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { tenantId: string; connectionId: string } }
) {
  return withApiContext(req, params, async (ctx) => {
    const body = await parseJson(req);
    const service = new IntegrationService(ctx.db, ctx.tenantId, ctx.actorUserId);
    const conn = await service.updateConnection(params.connectionId, body);
    return jsonOk(conn);
  });
}
