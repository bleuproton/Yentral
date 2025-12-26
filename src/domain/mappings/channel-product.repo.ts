import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export class ChannelProductRepository {
  constructor(private readonly db: Prisma.TransactionClient | typeof prisma = prisma) {}

  findByExternal(tenantId: string, connectionId: string, externalId: string) {
    return this.db.channelProduct.findFirst({ where: { tenantId, connectionId, externalId } });
  }

  findByProduct(tenantId: string, connectionId: string, productId: string) {
    return this.db.channelProduct.findFirst({ where: { tenantId, connectionId, productId } });
  }

  upsertByExternal(
    tenantId: string,
    connectionId: string,
    externalId: string,
    productId: string,
    raw?: Prisma.JsonValue
  ) {
    return this.db.channelProduct.upsert({
      where: { tenantId_connectionId_externalId: { tenantId, connectionId, externalId } },
      update: { productId, raw: raw ?? null },
      create: { tenantId, connectionId, externalId, productId, raw: raw ?? null }
    });
  }

  updateByProduct(
    tenantId: string,
    connectionId: string,
    productId: string,
    externalId: string,
    raw?: Prisma.JsonValue
  ) {
    return this.db.channelProduct.update({
      where: { tenantId_connectionId_productId: { tenantId, connectionId, productId } },
      data: { externalId, raw: raw ?? null }
    });
  }
}
