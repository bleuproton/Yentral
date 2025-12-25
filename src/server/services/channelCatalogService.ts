import prisma from "@/lib/prisma";

export class ChannelCatalogService {
  async linkProduct(tenantId: string, connectionId: string, externalId: string, productId: string, raw?: any) {
    const [connection, product] = await Promise.all([
      prisma.integrationConnection.findFirst({ where: { id: connectionId, tenantId } }),
      prisma.product.findFirst({ where: { id: productId, tenantId } })
    ]);
    if (!connection) throw new Error("CONNECTION_NOT_FOUND");
    if (!product) throw new Error("PRODUCT_NOT_FOUND");

    return prisma.$transaction(async (tx) => {
      // If this product is already linked under same connection, update its externalId/raw
      const existingByProduct = await tx.channelProduct.findFirst({
        where: { tenantId, connectionId, productId }
      });
      if (existingByProduct) {
        return tx.channelProduct.update({
          where: { tenantId_connectionId_productId: { tenantId, connectionId, productId } },
          data: { externalId, raw: raw ?? null }
        });
      }

      // Upsert by externalId
      return tx.channelProduct.upsert({
        where: { tenantId_connectionId_externalId: { tenantId, connectionId, externalId } },
        update: { productId, raw: raw ?? null },
        create: { tenantId, connectionId, productId, externalId, raw: raw ?? null }
      });
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
      const existingByVariant = await tx.channelVariant.findFirst({
        where: { tenantId, connectionId, variantId }
      });
      if (existingByVariant) {
        return tx.channelVariant.update({
          where: { tenantId_connectionId_variantId: { tenantId, connectionId, variantId } },
          data: {
            externalId,
            asin: asin ?? null,
            externalSku: externalSku ?? null,
            raw: raw ?? null
          }
        });
      }

      return tx.channelVariant.upsert({
        where: { tenantId_connectionId_externalId: { tenantId, connectionId, externalId } },
        update: {
          variantId,
          asin: asin ?? null,
          externalSku: externalSku ?? null,
          raw: raw ?? null
        },
        create: {
          tenantId,
          connectionId,
          variantId,
          externalId,
          asin: asin ?? null,
          externalSku: externalSku ?? null,
          raw: raw ?? null
        }
      });
    });
  }

  resolveVariantByExternalId(tenantId: string, connectionId: string, externalId: string) {
    return prisma.channelVariant.findFirst({
      where: { tenantId, connectionId, externalId }
    });
  }
}
