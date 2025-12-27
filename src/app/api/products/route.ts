// @ts-nocheck
import { NextRequest } from 'next/server';
import { buildContext } from '@/server/tenant/buildContext';
import { jsonOk, jsonError, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { ProductService } from '@/server/services/productService';
import { ProductCreateSchema } from '@/server/validators/product';

export async function GET(req: NextRequest) {
  try {
    const ctx = await buildContext(req);
    const search = req.nextUrl.searchParams;
    const q = search.get('q') || undefined;
    const status = search.get('status') || undefined;
    const take = search.get('take') ? Number(search.get('take')) : undefined;
    const skip = search.get('skip') ? Number(search.get('skip')) : undefined;
    const service = new ProductService();
    const products = await service.list(ctx, { q, status, take, skip });
    return jsonOk(products);
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await buildContext(req);
    requireWriteAccess(ctx, 'product.write');
    const body = ProductCreateSchema.parse(await parseJson(req));
    const service = new ProductService();
    const product = await service.createProductWithDefaultVariant(ctx, body, body.sku);
    return jsonOk(product, 201);
  } catch (err) {
    return jsonError(err);
  }
}
