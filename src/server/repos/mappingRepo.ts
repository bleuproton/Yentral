import { prisma } from '../db';
import { withContext } from '../tenant/als';
import { RequestContext } from '../tenant/context';

export class MappingRepo {
  async upsertWarehouseMapping(ctx: RequestContext, connectionId: string, externalLocationId: string, warehouseId: string) {
    return withContext(ctx, () =>
      prisma.warehouseMapping.upsert({
        where: {
          tenantId_connectionId_externalLocationId: { tenantId: ctx.tenantId, connectionId, externalLocationId },
        },
        create: { tenantId: ctx.tenantId, connectionId, externalLocationId, warehouseId },
        update: { warehouseId },
      })
    );
  }

  async resolveWarehouse(ctx: RequestContext, connectionId: string, externalLocationId: string) {
    return withContext(ctx, () =>
      prisma.warehouseMapping.findUnique({
        where: {
          tenantId_connectionId_externalLocationId: { tenantId: ctx.tenantId, connectionId, externalLocationId },
        },
      })
    );
  }

  async linkChannelProduct(ctx: RequestContext, connectionId: string, externalId: string, productId: string, raw?: any) {
    return withContext(ctx, () =>
      prisma.channelProduct.upsert({
        where: { tenantId_connectionId_externalId: { tenantId: ctx.tenantId, connectionId, externalId } },
        create: { tenantId: ctx.tenantId, connectionId, externalId, productId, raw: raw ?? null },
        update: { productId, raw: raw ?? null },
      })
    );
  }

  async linkChannelVariant(
    ctx: RequestContext,
    connectionId: string,
    externalId: string,
    variantId: string,
    asin?: string,
    externalSku?: string,
    raw?: any
  ) {
    return withContext(ctx, () =>
      prisma.channelVariant.upsert({
        where: { tenantId_connectionId_externalId: { tenantId: ctx.tenantId, connectionId, externalId } },
        create: { tenantId: ctx.tenantId, connectionId, externalId, variantId, asin: asin ?? null, externalSku: externalSku ?? null, raw: raw ?? null },
        update: { variantId, asin: asin ?? null, externalSku: externalSku ?? null, raw: raw ?? null },
      })
    );
  }

  async linkChannelOrder(ctx: RequestContext, connectionId: string, externalOrderId: string, orderId: string, raw?: any) {
    return withContext(ctx, () =>
      prisma.channelOrder.upsert({
        where: { tenantId_connectionId_externalOrderId: { tenantId: ctx.tenantId, connectionId, externalOrderId } },
        create: { tenantId: ctx.tenantId, connectionId, externalOrderId, orderId, raw: raw ?? null },
        update: { orderId, raw: raw ?? null },
      })
    );
  }
}
