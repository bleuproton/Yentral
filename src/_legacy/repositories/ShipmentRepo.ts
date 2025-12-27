// @ts-nocheck
import { prisma } from "@/lib/prisma";
import type { Prisma, Shipment } from "@prisma/client";

export class ShipmentRepo {
  create(data: Prisma.ShipmentUncheckedCreateInput) {
    return prisma.shipment.create({ data });
  }

  createLines(data: Prisma.ShipmentLineUncheckedCreateInput[]) {
    return prisma.$transaction(data.map((d) => prisma.shipmentLine.create({ data: d })));
  }

  findById(tenantId: string, id: string) {
    return prisma.shipment.findFirst({ where: { tenantId, id }, include: { lines: true } });
  }

  list(tenantId: string, filters?: { orderId?: string; status?: string }) {
    return prisma.shipment.findMany({
      where: { tenantId, orderId: filters?.orderId, status: filters?.status as any },
      orderBy: { createdAt: "desc" },
      include: { lines: true }
    });
  }

  updateStatus(tenantId: string, id: string, data: Prisma.ShipmentUpdateInput) {
    return prisma.shipment.updateMany({ where: { tenantId, id }, data });
  }
}
