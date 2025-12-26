import { StockReason, ReservationStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class InventoryService {
  async adjustStock(tenantId: string, input: { warehouseId: string; variantId: string; qtyDelta: number; reason?: StockReason; refType?: string; refId?: string }) {
    return prisma.stockLedger.create({
      data: {
        tenantId,
        warehouseId: input.warehouseId,
        variantId: input.variantId,
        qtyDelta: input.qtyDelta,
        reason: input.reason ?? StockReason.ADJUST,
        refType: input.refType,
        refId: input.refId
      }
    });
  }

  async reserve(tenantId: string, input: { orderLineId: string; warehouseId: string; variantId: string; qty: number }) {
    const res = await prisma.inventoryReservation.create({
      data: {
        tenantId,
        orderLineId: input.orderLineId,
        warehouseId: input.warehouseId,
        variantId: input.variantId,
        qty: input.qty,
        status: ReservationStatus.ACTIVE
      }
    });
    await this.adjustStock(tenantId, {
      warehouseId: input.warehouseId,
      variantId: input.variantId,
      qtyDelta: -input.qty,
      reason: StockReason.RESERVE,
      refType: "OrderLine",
      refId: input.orderLineId
    });
    return res;
  }

  async release(tenantId: string, reservationId: string) {
    const reservation = await prisma.inventoryReservation.update({
      where: { id: reservationId },
      data: { status: ReservationStatus.RELEASED }
    });
    await this.adjustStock(tenantId, {
      warehouseId: reservation.warehouseId,
      variantId: reservation.variantId,
      qtyDelta: reservation.qty,
      reason: StockReason.RELEASE,
      refType: "Reservation",
      refId: reservationId
    });
    return reservation;
  }

  async consume(tenantId: string, reservationId: string) {
    return prisma.inventoryReservation.update({
      where: { id: reservationId },
      data: { status: ReservationStatus.CONSUMED }
    });
  }

  async rebuildSnapshot(tenantId: string, warehouseId: string, variantId: string) {
    const agg = await prisma.stockLedger.groupBy({
      by: ["variantId", "warehouseId", "tenantId"],
      where: { tenantId, warehouseId, variantId },
      _sum: { qtyDelta: true }
    });
    const onHand = agg[0]?._sum.qtyDelta ?? 0;
    const reservedAgg = await prisma.inventoryReservation.aggregate({
      where: { tenantId, warehouseId, variantId, status: ReservationStatus.ACTIVE },
      _sum: { qty: true }
    });
    const reserved = reservedAgg._sum.qty ?? 0;
    const available = onHand - reserved;

    return prisma.stockSnapshot.upsert({
      where: { tenantId_warehouseId_variantId: { tenantId, warehouseId, variantId } },
      update: { onHand, reserved, available, createdAt: new Date() },
      create: { tenantId, warehouseId, variantId, onHand, reserved, available }
    });
  }
}
