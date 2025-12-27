import { NextRequest } from 'next/server';
import { withApiContext } from '@/server/http/withApiContext';
import { jsonOk, created } from '@/server/http/response';
import { parsePagination, parseJson } from '@/server/http/validators';
import { ProductService } from '@/server/services/productService';

export async function GET(req: NextRequest, { params }: { params: { tenantId: string } }) {
  return withApiContext(req, params, async (ctx) => {
    const search = req.nextUrl.searchParams;
    const q = search.get('q') || undefined;
    const status = search.get('status') || undefined;
    const service = new ProductService(ctx.db, ctx.tenantId, ctx.actorUserId);
    const products = await service.listProducts({ q, status });
    return jsonOk(products);
  });
}

export async function POST(req: NextRequest, { params }: { params: { tenantId: string } }) {
  return withApiContext(req, params, async (ctx) => {
    const body = await parseJson(req);
    const service = new ProductService(ctx.db, ctx.tenantId, ctx.actorUserId);
    const product = await service.createProduct(body);
    return created(product);
  });
}
