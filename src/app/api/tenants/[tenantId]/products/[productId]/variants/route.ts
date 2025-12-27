// @ts-nocheck
import { NextRequest } from 'next/server';
import { withApiContext } from '@/server/http/withApiContext';
import { jsonOk, created } from '@/server/http/response';
import { parseJson } from '@/server/http/validators';
import { ProductService } from '@/server/services/productService';

export async function GET(req: NextRequest, { params }: { params: { tenantId: string; productId: string } }) {
  return withApiContext(req, params, async (ctx) => {
    const service = new ProductService(ctx.db, ctx.tenantId, ctx.actorUserId);
    const variants = await service.listVariants(params.productId);
    return jsonOk(variants);
  });
}

export async function POST(req: NextRequest, { params }: { params: { tenantId: string; productId: string } }) {
  return withApiContext(req, params, async (ctx) => {
    const body = await parseJson(req);
    const service = new ProductService(ctx.db, ctx.tenantId, ctx.actorUserId);
    const variant = await service.createVariant(params.productId, body);
    return created(variant);
  });
}
