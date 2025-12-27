// @ts-nocheck
import prisma from "@/server/db/prisma";

export class ChannelCatalogService {
  async linkProduct(
    tenantId: string,
    connectionId: string,
    externalId: string,
    productId: string,
    raw?: any
  ) {
    const [connection, product] = await Promise.all([
      prisma.integrationConnection.findFirst({ where: { tenantId, id: connectionId } }),
      prisma.product.findFirst({ where: { tenantId, id: productId } })
    ]);
    if (!connection) throw new Error("CONNECTION_NOT_FOUND");
    if (!product) throw new Error("PRODUCT_NOT_FOUND");

    return prisma.channelProduct.upsert({
      where: { tenantId_connectionId_externalId: { tenantId, connectionId, externalId } },
      update: { productId, raw: raw ?? null },
      create: { tenantId, connectionId, externalId, productId, raw: raw ?? null }
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
      prisma.integrationConnection.findFirst({ where: { tenantId, id: connectionId } }),
      prisma.productVariant.findFirst({ where: { tenantId, id: variantId } })
    ]);
    if (!connection) throw new Error("CONNECTION_NOT_FOUND");
    if (!variant) throw new Error("VARIANT_NOT_FOUND");

    return prisma.channelVariant.upsert({
      where: { tenantId_connectionId_externalId: { tenantId, connectionId, externalId } },
      update: { variantId, asin: asin ?? null, externalSku: externalSku ?? null, raw: raw ?? null },
      create: {
        tenantId,
        connectionId,
        externalId,
        variantId,
        asin: asin ?? null,
        externalSku: externalSku ?? null,
        raw: raw ?? null
      }
    });
  }

  resolveVariantByExternalId(tenantId: string, connectionId: string, externalId: string) {
    return prisma.channelVariant.findUnique({
      where: { tenantId_connectionId_externalId: { tenantId, connectionId, externalId } }
    });
  }
}
