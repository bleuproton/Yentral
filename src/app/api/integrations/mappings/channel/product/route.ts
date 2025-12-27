// @ts-nocheck
import { NextRequest } from 'next/server';
import { buildContext } from '@/server/tenant/buildContext';
import { jsonOk, jsonError, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { ChannelCatalogService } from '@/server/services/channelCatalogService';
import { ChannelProductLinkSchema } from '@/server/validators/integration';

export async function POST(req: NextRequest) {
  try {
    const ctx = await buildContext(req);
    requireWriteAccess(ctx, 'integration.write');
    const body = ChannelProductLinkSchema.parse(await parseJson(req));
    const svc = new ChannelCatalogService();
    const result = await svc.linkProduct(ctx, body.connectionId, body.externalId, body.productId, body.raw);
    return jsonOk(result, 201);
  } catch (err) {
    return jsonError(err);
  }
}
