// @ts-nocheck
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { jsonOk, parseJson } from '@/app/api/_utils';
import { MediaService } from '@/server/services/mediaService';

export const POST = tenantRoute(async ({ req, ctx, params }) => {
  const body = await parseJson(req);
  const service = new MediaService();
  const attached = await service.attachToProduct(ctx, params.id, body.assetId, body.altText, body.sortOrder ?? 0);
  return jsonOk(attached, 201);
});
