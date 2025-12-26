import prisma from "@/lib/prisma";

export class ChannelOrderService {
  async linkOrder(tenantId: string, connectionId: string, externalOrderId: string, orderId: string, raw?: any) {
    const [connection, order] = await Promise.all([
      prisma.integrationConnection.findFirst({ where: { id: connectionId, tenantId } }),
      prisma.order.findFirst({ where: { id: orderId, tenantId } })
    ]);
    if (!connection) throw new Error("CONNECTION_NOT_FOUND");
    if (!order) throw new Error("ORDER_NOT_FOUND");

    return prisma.channelOrder.upsert({
      where: { tenantId_connectionId_externalOrderId: { tenantId, connectionId, externalOrderId } },
      update: { orderId, raw: raw ?? null },
      create: { tenantId, connectionId, orderId, externalOrderId, raw: raw ?? null }
    });
  }

  resolveOrderByExternalId(tenantId: string, connectionId: string, externalOrderId: string) {
    return prisma.channelOrder.findFirst({
      where: { tenantId, connectionId, externalOrderId }
    });
  }
}
