// @ts-nocheck
import { NextRequest } from 'next/server';
import { withApiContext } from '@/server/http/withApiContext';
import { jsonOk, noContent } from '@/server/http/response';
import { parseJson } from '@/server/http/validators';
import { ProductService } from '@/server/services/productService';

export async function GET(req: NextRequest, { params }: { params: { tenantId: string; productId: string } }) {
  return withApiContext(req, params, async (ctx) => {
    const service = new ProductService(ctx.db, ctx.tenantId, ctx.actorUserId);
    const product = await service.getProduct(params.productId);
    return jsonOk(product);
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { tenantId: string; productId: string } }) {
  return withApiContext(req, params, async (ctx) => {
    const body = await parseJson(req);
    const service = new ProductService(ctx.db, ctx.tenantId, ctx.actorUserId);
    const product = await service.updateProduct(params.productId, body);
    return jsonOk(product);
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { tenantId: string; productId: string } }) {
  return withApiContext(req, params, async (ctx) => {
    const service = new ProductService(ctx.db, ctx.tenantId, ctx.actorUserId);
    await service.deleteProduct(params.productId);
    return noContent();
  });
}
