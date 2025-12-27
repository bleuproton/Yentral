import { NextRequest } from 'next/server';
import { withApiContext } from '@/server/http/withApiContext';
import { jsonOk, created } from '@/server/http/response';
import { parseJson } from '@/server/http/validators';
import { IntegrationService } from '@/server/services/integrationService';

export async function GET(req: NextRequest, { params }: { params: { tenantId: string } }) {
  return withApiContext(req, params, async (ctx) => {
    const service = new IntegrationService(ctx.db, ctx.tenantId, ctx.actorUserId);
    const list = await service.listConnections();
    return jsonOk(list);
  });
}

export async function POST(req: NextRequest, { params }: { params: { tenantId: string } }) {
  return withApiContext(req, params, async (ctx) => {
    const body = await parseJson(req);
    const service = new IntegrationService(ctx.db, ctx.tenantId, ctx.actorUserId);
    const conn = await service.createConnection(body);
    return created(conn);
  });
}
