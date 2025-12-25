import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export class ChannelVariantRepository {
  constructor(private readonly db: Prisma.TransactionClient | typeof prisma = prisma) {}

  findByExternal(tenantId: string, connectionId: string, externalId: string) {
    return this.db.channelVariant.findFirst({ where: { tenantId, connectionId, externalId } });
  }

  findByVariant(tenantId: string, connectionId: string, variantId: string) {
    return this.db.channelVariant.findFirst({ where: { tenantId, connectionId, variantId } });
  }

  upsertByExternal(
    tenantId: string,
    connectionId: string,
    externalId: string,
    variantId: string,
    asin?: string | null,
    externalSku?: string | null,
    raw?: Prisma.JsonValue
  ) {
    return this.db.channelVariant.upsert({
      where: { tenantId_connectionId_externalId: { tenantId, connectionId, externalId } },
      update: { variantId, asin: asin ?? null, externalSku: externalSku ?? null, raw: raw ?? null },
      create: { tenantId, connectionId, externalId, variantId, asin: asin ?? null, externalSku: externalSku ?? null, raw: raw ?? null }
    });
  }

  updateByVariant(
    tenantId: string,
    connectionId: string,
    variantId: string,
    externalId: string,
    asin?: string | null,
    externalSku?: string | null,
    raw?: Prisma.JsonValue
  ) {
    return this.db.channelVariant.update({
      where: { tenantId_connectionId_variantId: { tenantId, connectionId, variantId } },
      data: { externalId, asin: asin ?? null, externalSku: externalSku ?? null, raw: raw ?? null }
    });
  }
}
