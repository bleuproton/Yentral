import { Prisma } from "@prisma/client";
import { ChannelProductRepo } from "../repositories/channelProductRepo";
import { ChannelVariantRepo } from "../repositories/channelVariantRepo";
import { prisma } from "../db/prisma";

export class ChannelCatalogService {
  async linkProduct(tenantId: string, connectionId: string, externalId: string, productId: string, raw?: Prisma.JsonValue) {
    return prisma.$transaction(async (tx) => {
      const productRepo = new ChannelProductRepo(tx);
      const conflict = await productRepo.findByExternal(tenantId, connectionId, externalId);
      if (conflict && conflict.productId !== productId) {
        throw new Error("External product ID already linked to a different product");
      }
      return productRepo.upsertByProduct(tenantId, connectionId, productId, externalId, raw);
    });
  }

  async linkVariant(
    tenantId: string,
    connectionId: string,
    externalId: string,
    variantId: string,
    asin?: string | null,
    externalSku?: string | null,
    raw?: Prisma.JsonValue
  ) {
    return prisma.$transaction(async (tx) => {
      const variantRepo = new ChannelVariantRepo(tx);
      const conflict = await variantRepo.findByExternal(tenantId, connectionId, externalId);
      if (conflict && conflict.variantId !== variantId) {
        throw new Error("External variant ID already linked to a different variant");
      }
      return variantRepo.upsertByVariant(
        tenantId,
        connectionId,
        variantId,
        externalId,
        asin ?? null,
        externalSku ?? null,
        raw
      );
    });
  }
}
