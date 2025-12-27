// @ts-nocheck
import prisma from "@/lib/prisma";
import { ChannelOrderRepository } from "./channel-order.repo";

export class ChannelOrderService {
  async linkOrder(tenantId: string, connectionId: string, externalOrderId: string, orderId: string, raw?: any) {
    const [connection, order] = await Promise.all([
      prisma.integrationConnection.findFirst({ where: { id: connectionId, tenantId } }),
      prisma.order.findFirst({ where: { id: orderId, tenantId } })
    ]);
    if (!connection) throw new Error("CONNECTION_NOT_FOUND");
    if (!order) throw new Error("ORDER_NOT_FOUND");

    const repo = new ChannelOrderRepository();
    return repo.upsertByExternal(tenantId, connectionId, externalOrderId, orderId, raw ?? null);
  }

  resolveOrderByExternalId(tenantId: string, connectionId: string, externalOrderId: string) {
    return prisma.channelOrder.findFirst({ where: { tenantId, connectionId, externalOrderId } });
  }
}
