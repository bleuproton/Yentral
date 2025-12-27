// @ts-nocheck
import { jsonOk, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { VariantService } from '@/server/services/variantService';
import { VariantCreateSchema } from '@/server/validators/product';

export const POST = tenantRoute(async ({ req, ctx }) => {
  requireWriteAccess(ctx, 'product.write');
  const body = VariantCreateSchema.parse(await parseJson(req));
  const service = new VariantService();
  const variant = await service.create(ctx, body);
  return jsonOk(variant, 201);
});

export const GET = tenantRoute(async ({ ctx, req }) => {
  const productId = req.nextUrl.searchParams.get('productId');
  const service = new VariantService();
  if (productId) {
    const variants = await service.listByProduct(ctx, productId);
    return jsonOk(variants);
  }
  return jsonOk([]);
});
