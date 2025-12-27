// @ts-nocheck
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { jsonOk, parseJson } from '@/app/api/_utils';
import { MediaService } from '@/server/services/mediaService';

export const POST = tenantRoute(async ({ req, ctx }) => {
  const body = await parseJson(req);
  const service = new MediaService();
  const asset = await service.registerAsset(ctx, body);
  return jsonOk(asset, 201);
});
