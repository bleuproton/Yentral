// @ts-nocheck
import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../db/prisma";

export class ChannelVariantRepo {
  constructor(private db: PrismaClient | Prisma.TransactionClient = prisma) {}

  async findByExternal(tenantId: string, connectionId: string, externalId: string) {
    return this.db.channelVariant.findFirst({
      where: { tenantId, connectionId, externalId }
    });
  }

  async findByVariant(tenantId: string, connectionId: string, variantId: string) {
    return this.db.channelVariant.findFirst({
      where: { tenantId, connectionId, variantId }
    });
  }

  async upsertByVariant(
    tenantId: string,
    connectionId: string,
    variantId: string,
    externalId: string,
    asin?: string | null,
    externalSku?: string | null,
    raw?: Prisma.JsonValue
  ) {
    return this.db.channelVariant.upsert({
      where: { tenantId_connectionId_variantId: { tenantId, connectionId, variantId } },
      update: { externalId, asin: asin ?? null, externalSku: externalSku ?? null, raw: raw ?? null },
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
  }
}
