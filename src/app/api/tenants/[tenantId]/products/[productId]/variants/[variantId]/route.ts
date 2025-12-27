// @ts-nocheck
import { NextRequest } from 'next/server';
import { withApiContext } from '@/server/http/withApiContext';
import { jsonOk, noContent } from '@/server/http/response';
import { parseJson } from '@/server/http/validators';
import { ProductService } from '@/server/services/productService';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { tenantId: string; productId: string; variantId: string } }
) {
  return withApiContext(req, params, async (ctx) => {
    const body = await parseJson(req);
    const service = new ProductService(ctx.db, ctx.tenantId, ctx.actorUserId);
    const variant = await service.updateVariant(params.variantId, body);
    return jsonOk(variant);
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { tenantId: string; productId: string; variantId: string } }
) {
  return withApiContext(req, params, async (ctx) => {
    const service = new ProductService(ctx.db, ctx.tenantId, ctx.actorUserId);
    await service.deleteVariant(params.variantId);
    return noContent();
  });
}
