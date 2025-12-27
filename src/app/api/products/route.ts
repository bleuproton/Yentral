import { withApi } from '@/server/http/withApi';
import { ProductService } from '@/server/services/productService';
import { tenantDb } from '@/server/db/tenantDb';
import { ProductCreateSchema } from '@/server/schemas/product';
import { parseJson } from '@/server/validation/zod';
import { jsonOk, created } from '@/server/http/response';

export const GET = withApi(async (ctx) => {
  const service = new ProductService(tenantDb(ctx.tenantId), ctx.tenantId, ctx.actorUserId || '');
  const products = await service.listProducts({});
  return jsonOk(products);
});

export const POST = withApi(async (ctx) => {
  const body = await parseJson(ctx.req, ProductCreateSchema);
  const service = new ProductService(tenantDb(ctx.tenantId), ctx.tenantId, ctx.actorUserId || '');
  const product = await service.createProduct(body);
  return created(product);
});
