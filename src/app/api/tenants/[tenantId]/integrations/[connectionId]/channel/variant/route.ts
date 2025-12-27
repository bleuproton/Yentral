import { NextRequest } from 'next/server';
import { withApiContext } from '@/server/http/withApiContext';
import { jsonOk } from '@/server/http/response';
import { parseJson } from '@/server/http/validators';
import { IntegrationService } from '@/server/services/integrationService';

export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string; connectionId: string } }
) {
  return withApiContext(req, params, async (ctx) => {
    const body = await parseJson(req);
    const service = new IntegrationService(ctx.db, ctx.tenantId, ctx.actorUserId);
    const res = await service.linkChannelVariant(params.connectionId, body);
    return jsonOk(res);
  });
}
