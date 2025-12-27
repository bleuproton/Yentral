// @ts-nocheck
import { jsonOk, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { VariantService } from '@/server/services/variantService';
import { VariantUpdateSchema } from '@/server/validators/product';

export const GET = tenantRoute(async ({ ctx, params }) => {
  const service = new VariantService();
  const variant = await service.get(ctx, params.id);
  return jsonOk(variant);
});

export const PATCH = tenantRoute(async ({ req, ctx, params }) => {
  requireWriteAccess(ctx, 'product.write');
  const body = VariantUpdateSchema.parse(await parseJson(req));
  const service = new VariantService();
  const updated = await service.update(ctx, params.id, body);
  return jsonOk(updated);
});
