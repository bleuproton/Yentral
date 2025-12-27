// @ts-nocheck
import { ReservationStatus } from "@prisma/client";
import { prisma } from "../db/prisma";

export class StockReservationRepo {
  async findActive(tenantId: string, criteria: { orderLineId?: string; warehouseId?: string; variantId?: string; dedupeKey?: string }) {
    return prisma.stockReservation.findFirst({
      where: {
        tenantId,
        status: ReservationStatus.ACTIVE,
        ...(criteria.dedupeKey ? { dedupeKey: criteria.dedupeKey } : {}),
        ...(criteria.orderLineId ? { orderLineId: criteria.orderLineId } : {}),
        ...(criteria.warehouseId ? { warehouseId: criteria.warehouseId } : {}),
        ...(criteria.variantId ? { variantId: criteria.variantId } : {})
      }
    });
  }

  async create(tenantId: string, data: { orderLineId: string; warehouseId: string; variantId: string; qty: number; dedupeKey?: string }) {
    return prisma.stockReservation.create({
      data: {
        tenantId,
        orderLineId: data.orderLineId,
        warehouseId: data.warehouseId,
        variantId: data.variantId,
        qty: data.qty,
        status: ReservationStatus.ACTIVE,
        dedupeKey: data.dedupeKey
      }
    });
  }

  async updateStatus(tenantId: string, id: string, status: ReservationStatus) {
    return prisma.stockReservation.update({
      where: { id },
      data: { status }
    });
  }

  async getById(tenantId: string, id: string) {
    return prisma.stockReservation.findFirst({ where: { tenantId, id } });
  }
}
