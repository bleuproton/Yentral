// @ts-nocheck
import { jsonOk, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { ProductService } from '@/server/services/productService';
import { ProductCreateSchema } from '@/server/validators/product';

export const GET = tenantRoute(async ({ req, ctx }) => {
  const search = req.nextUrl.searchParams;
  const q = search.get('q') || undefined;
  const status = search.get('status') || undefined;
  const take = search.get('take') ? Number(search.get('take')) : undefined;
  const skip = search.get('skip') ? Number(search.get('skip')) : undefined;
  const service = new ProductService();
  const products = await service.list(ctx, { q, status, take, skip });
  return jsonOk(products);
});

export const POST = tenantRoute(async ({ req, ctx }) => {
  requireWriteAccess(ctx, 'product.write');
  const body = ProductCreateSchema.parse(await parseJson(req));
  const service = new ProductService();
  const product = await service.createProductWithDefaultVariant(ctx, body, body.sku);
  return jsonOk(product, 201);
});
