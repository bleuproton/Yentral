// @ts-nocheck
import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../db/prisma";

export class ChannelProductRepo {
  constructor(private db: PrismaClient | Prisma.TransactionClient = prisma) {}

  async findByExternal(tenantId: string, connectionId: string, externalId: string) {
    return this.db.channelProduct.findFirst({
      where: { tenantId, connectionId, externalId }
    });
  }

  async findByProduct(tenantId: string, connectionId: string, productId: string) {
    return this.db.channelProduct.findFirst({
      where: { tenantId, connectionId, productId }
    });
  }

  async upsertByProduct(tenantId: string, connectionId: string, productId: string, externalId: string, raw?: Prisma.JsonValue) {
    return this.db.channelProduct.upsert({
      where: { tenantId_connectionId_productId: { tenantId, connectionId, productId } },
      update: { externalId, raw: raw ?? null },
      create: { tenantId, connectionId, productId, externalId, raw: raw ?? null }
    });
  }
}
