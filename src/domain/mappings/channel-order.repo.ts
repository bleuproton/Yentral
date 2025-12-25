import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export class ChannelOrderRepository {
  constructor(private readonly db: Prisma.TransactionClient | typeof prisma = prisma) {}

  findByExternal(tenantId: string, connectionId: string, externalOrderId: string) {
    return this.db.channelOrder.findFirst({ where: { tenantId, connectionId, externalOrderId } });
  }

  upsertByExternal(
    tenantId: string,
    connectionId: string,
    externalOrderId: string,
    orderId: string,
    raw?: Prisma.JsonValue
  ) {
    return this.db.channelOrder.upsert({
      where: { tenantId_connectionId_externalOrderId: { tenantId, connectionId, externalOrderId } },
      update: { orderId, raw: raw ?? null },
      create: { tenantId, connectionId, externalOrderId, orderId, raw: raw ?? null }
    });
  }
}
