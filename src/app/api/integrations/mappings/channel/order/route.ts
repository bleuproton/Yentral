import { NextRequest } from 'next/server';
import { buildContext } from '@/server/tenant/buildContext';
import { jsonOk, jsonError, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { ChannelOrderService } from '@/server/services/channelOrderService';
import { ChannelOrderLinkSchema } from '@/server/validators/integration';

export async function POST(req: NextRequest) {
  try {
    const ctx = await buildContext(req);
    requireWriteAccess(ctx, 'integration.write');
    const body = ChannelOrderLinkSchema.parse(await parseJson(req));
    const svc = new ChannelOrderService();
    const result = await svc.linkOrder(ctx, body.connectionId, body.externalOrderId, body.orderId, body.raw);
    return jsonOk(result, 201);
  } catch (err) {
    return jsonError(err);
  }
}
