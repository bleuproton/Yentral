import { NextRequest } from 'next/server';
import { buildContext } from '@/server/tenant/buildContext';
import { jsonOk, jsonError, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { ProductService } from '@/server/services/productService';
import { ProductUpdateSchema } from '@/server/validators/product';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await buildContext(req);
    const service = new ProductService();
    const product = await service.get(ctx, params.id);
    return jsonOk(product);
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await buildContext(req);
    requireWriteAccess(ctx, 'product.write');
    const body = ProductUpdateSchema.parse(await parseJson(req));
    const service = new ProductService();
    const updated = await service.update(ctx, params.id, body);
    return jsonOk(updated);
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await buildContext(req);
    requireWriteAccess(ctx, 'product.write');
    const service = new ProductService();
    const updated = await service.update(ctx, params.id, { status: 'ARCHIVED' } as any);
    return jsonOk(updated);
  } catch (err) {
    return jsonError(err);
  }
}
