// @ts-nocheck
import { NextRequest } from 'next/server';
import { withApiContext } from '@/server/http/withApiContext';
import { jsonOk, created } from '@/server/http/response';
import { parseJson } from '@/server/http/validators';
import { PluginService } from '@/server/services/pluginService';

export async function GET(req: NextRequest, { params }: { params: { tenantId: string } }) {
  return withApiContext(req, params, async (ctx) => {
    const service = new PluginService(ctx.tenantId, ctx.actorUserId);
    const list = await service.listPlugins();
    return jsonOk(list);
  });
}

export async function POST(req: NextRequest, { params }: { params: { tenantId: string } }) {
  return withApiContext(req, params, async (ctx) => {
    const body = await parseJson(req);
    const service = new PluginService(ctx.tenantId, ctx.actorUserId);
    const installed = await service.installPlugin(body.pluginId, body.enabled ?? true, body.version);
    return created(installed);
  });
}
