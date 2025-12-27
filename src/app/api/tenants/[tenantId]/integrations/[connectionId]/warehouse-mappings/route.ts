// @ts-nocheck
import { NextRequest } from 'next/server';
import { withApiContext } from '@/server/http/withApiContext';
import { jsonOk, created } from '@/server/http/response';
import { parseJson } from '@/server/http/validators';
import { IntegrationService } from '@/server/services/integrationService';

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string; connectionId: string } }
) {
  return withApiContext(req, params, async (ctx) => {
    const service = new IntegrationService(ctx.db, ctx.tenantId, ctx.actorUserId);
    // No list schema provided; fetch all mappings for connection
    const mappings = await ctx.db.warehouseMapping.findMany({
      where: { tenantId: ctx.tenantId, connectionId: params.connectionId },
    });
    return jsonOk(mappings);
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string; connectionId: string } }
) {
  return withApiContext(req, params, async (ctx) => {
    const body = await parseJson(req);
    const service = new IntegrationService(ctx.db, ctx.tenantId, ctx.actorUserId);
    const mapping = await service.upsertWarehouseMapping(params.connectionId, body);
    return created(mapping);
  });
}
