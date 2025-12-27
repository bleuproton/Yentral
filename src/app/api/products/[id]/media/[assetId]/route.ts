// @ts-nocheck
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { jsonOk } from '@/app/api/_utils';
import { MediaService } from '@/server/services/mediaService';

export const DELETE = tenantRoute(async ({ ctx, params }) => {
  const service = new MediaService();
  await service.detachFromProduct(ctx, params.id, params.assetId);
  return jsonOk({ ok: true });
});
