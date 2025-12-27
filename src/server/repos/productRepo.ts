// @ts-nocheck
import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import { withContext } from '../tenant/als';
import { RequestContext } from '../tenant/context';

export class ProductRepo {
  async createProduct(ctx: RequestContext, data: Prisma.ProductUncheckedCreateInput) {
    return withContext(ctx, () =>
      prisma.product.create({
        data: { ...data, tenantId: ctx.tenantId },
      })
    );
  }

  async updateProduct(ctx: RequestContext, id: string, data: Prisma.ProductUpdateInput) {
    return withContext(ctx, () =>
      prisma.product.update({
        where: { tenantId_id: { tenantId: ctx.tenantId, id } },
        data,
      })
    );
  }

  async listProducts(
    ctx: RequestContext,
    opts: { q?: string; status?: string; take?: number; skip?: number } = {}
  ) {
    const where: Prisma.ProductWhereInput = { tenantId: ctx.tenantId };
    if (opts.q) {
      where.OR = [
        { name: { contains: opts.q, mode: 'insensitive' } },
        { sku: { contains: opts.q, mode: 'insensitive' } },
      ];
    }
    if (opts.status) where.status = opts.status;

    return withContext(ctx, () =>
      prisma.product.findMany({
        where,
        take: opts.take,
        skip: opts.skip,
        orderBy: { createdAt: 'desc' },
      })
    );
  }

  async getProduct(ctx: RequestContext, id: string) {
    return withContext(ctx, () =>
      prisma.product.findUnique({
        where: { tenantId_id: { tenantId: ctx.tenantId, id } },
      })
    );
  }
}
