import prisma from "@/lib/prisma";
import { ChannelProductRepository } from "./channel-product.repo";
import { ChannelVariantRepository } from "./channel-variant.repo";

export class ChannelCatalogService {
  async linkProduct(tenantId: string, connectionId: string, externalId: string, productId: string, raw?: any) {
    const [connection, product] = await Promise.all([
      prisma.integrationConnection.findFirst({ where: { id: connectionId, tenantId } }),
      prisma.product.findFirst({ where: { id: productId, tenantId } })
    ]);
    if (!connection) throw new Error("CONNECTION_NOT_FOUND");
    if (!product) throw new Error("PRODUCT_NOT_FOUND");

    return prisma.$transaction(async (tx) => {
      const repo = new ChannelProductRepository(tx);
      const existingByProduct = await repo.findByProduct(tenantId, connectionId, productId);
      if (existingByProduct) {
        return repo.updateByProduct(tenantId, connectionId, productId, externalId, raw ?? null);
      }
      return repo.upsertByExternal(tenantId, connectionId, externalId, productId, raw ?? null);
    });
  }

  async linkVariant(
    tenantId: string,
    connectionId: string,
    externalId: string,
    variantId: string,
    asin?: string | null,
    externalSku?: string | null,
    raw?: any
  ) {
    const [connection, variant] = await Promise.all([
      prisma.integrationConnection.findFirst({ where: { id: connectionId, tenantId } }),
      prisma.productVariant.findFirst({ where: { id: variantId, tenantId } })
    ]);
    if (!connection) throw new Error("CONNECTION_NOT_FOUND");
    if (!variant) throw new Error("VARIANT_NOT_FOUND");

    return prisma.$transaction(async (tx) => {
      const repo = new ChannelVariantRepository(tx);
      const existingByVariant = await repo.findByVariant(tenantId, connectionId, variantId);
      if (existingByVariant) {
        return repo.updateByVariant(tenantId, connectionId, variantId, externalId, asin ?? null, externalSku ?? null, raw ?? null);
      }
      return repo.upsertByExternal(tenantId, connectionId, externalId, variantId, asin ?? null, externalSku ?? null, raw ?? null);
    });
  }

  resolveVariantByExternalId(tenantId: string, connectionId: string, externalId: string) {
    return prisma.channelVariant.findFirst({ where: { tenantId, connectionId, externalId } });
  }
}
