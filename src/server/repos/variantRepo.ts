// @ts-nocheck
import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import { withContext } from '../tenant/als';
import { RequestContext } from '../tenant/context';

export class VariantRepo {
  async createVariant(ctx: RequestContext, data: Prisma.ProductVariantUncheckedCreateInput) {
    return withContext(ctx, () =>
      prisma.productVariant.create({
        data: { ...data, tenantId: ctx.tenantId },
      })
    );
  }

  async listVariantsByProduct(ctx: RequestContext, productId: string) {
    return withContext(ctx, () =>
      prisma.productVariant.findMany({
        where: { tenantId: ctx.tenantId, productId },
        orderBy: { createdAt: 'desc' },
      })
    );
  }

  async getVariant(ctx: RequestContext, id: string) {
    return withContext(ctx, () =>
      prisma.productVariant.findUnique({
        where: { tenantId_id: { tenantId: ctx.tenantId, id } },
      })
    );
  }

  async updateVariant(ctx: RequestContext, id: string, data: Prisma.ProductVariantUpdateInput) {
    return withContext(ctx, () =>
      prisma.productVariant.update({
        where: { tenantId_id: { tenantId: ctx.tenantId, id } },
        data,
      })
    );
  }
}
