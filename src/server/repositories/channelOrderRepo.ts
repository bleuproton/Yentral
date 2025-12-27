// @ts-nocheck
import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../db/prisma";

export class ChannelOrderRepo {
  constructor(private db: PrismaClient | Prisma.TransactionClient = prisma) {}

  async findByExternal(tenantId: string, connectionId: string, externalOrderId: string) {
    return this.db.channelOrder.findFirst({
      where: { tenantId, connectionId, externalOrderId }
    });
  }

  async findByOrder(tenantId: string, connectionId: string, orderId: string) {
    return this.db.channelOrder.findFirst({
      where: { tenantId, connectionId, orderId }
    });
  }

  async upsertByOrder(
    tenantId: string,
    connectionId: string,
    orderId: string,
    externalOrderId: string,
    raw?: Prisma.JsonValue
  ) {
    return this.db.channelOrder.upsert({
      where: { tenantId_connectionId_orderId: { tenantId, connectionId, orderId } },
      update: { externalOrderId, raw: raw ?? null },
      create: { tenantId, connectionId, orderId, externalOrderId, raw: raw ?? null }
    });
  }
}
