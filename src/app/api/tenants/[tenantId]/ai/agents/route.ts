// @ts-nocheck
import { NextRequest } from 'next/server';
import { withApiContext } from '@/server/http/withApiContext';
import { jsonOk } from '@/server/http/response';
import { parseJson } from '@/server/http/validators';
import { AiService } from '@/server/services/aiService';

export async function POST(req: NextRequest, { params }: { params: { tenantId: string } }) {
  return withApiContext(req, params, async (ctx) => {
    const body = await parseJson(req);
    const agent = body?.agent as string;
    const payload = body?.payload ?? {};
    const ai = new AiService(ctx.tenantId, ctx.actorUserId);
    let result;
    switch (agent) {
      case 'listing':
        result = ai.listingOptimizer(payload);
        break;
      case 'support':
        result = ai.supportTriage(payload);
        break;
      case 'inventory':
        result = ai.inventoryAnomaly(payload);
        break;
      default:
        throw new Error('Unknown agent');
    }
    return jsonOk(result);
  });
}
