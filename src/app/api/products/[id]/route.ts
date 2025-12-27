// @ts-nocheck
import { jsonOk, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { ProductService } from '@/server/services/productService';
import { ProductUpdateSchema } from '@/server/validators/product';

export const GET = tenantRoute(async ({ ctx, params }) => {
  const service = new ProductService();
  const product = await service.get(ctx, params.id);
  return jsonOk(product);
});

export const PATCH = tenantRoute(async ({ req, ctx, params }) => {
  requireWriteAccess(ctx, 'product.write');
  const body = ProductUpdateSchema.parse(await parseJson(req));
  const service = new ProductService();
  const updated = await service.update(ctx, params.id, body);
  return jsonOk(updated);
});

export const DELETE = tenantRoute(async ({ ctx, params }) => {
  requireWriteAccess(ctx, 'product.write');
  const service = new ProductService();
  const updated = await service.update(ctx, params.id, { status: 'ARCHIVED' } as any);
  return jsonOk(updated);
});
