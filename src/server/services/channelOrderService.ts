import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import { ChannelOrderRepo } from "../repositories/channelOrderRepo";

export class ChannelOrderService {
  async linkOrder(
    tenantId: string,
    connectionId: string,
    externalOrderId: string,
    orderId: string,
    raw?: Prisma.JsonValue
  ) {
    return prisma.$transaction(async (tx) => {
      const orderRepo = new ChannelOrderRepo(tx);
      const conflict = await orderRepo.findByExternal(tenantId, connectionId, externalOrderId);
      if (conflict && conflict.orderId !== orderId) {
        throw new Error("External order ID already linked to a different order");
      }
      return orderRepo.upsertByOrder(tenantId, connectionId, orderId, externalOrderId, raw);
    });
  }
}
