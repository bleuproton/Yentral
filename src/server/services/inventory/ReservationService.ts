import { Prisma, ReservationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { StockService } from "./StockService";

export class ReservationService {
  constructor(private readonly db: Prisma.TransactionClient | typeof prisma = prisma, private readonly stock = new StockService(db)) {}

  /**
   * Consume ACTIVE reservations for a given order line/variant/warehouse until qtyToConsume is met.
   * If a reservation has more qty than needed, split it: consume the needed part, keep the remainder ACTIVE.
   */
  async consumeActiveReservationsExactOrSplit(params: {
    tenantId: string;
    orderLineId: string;
    warehouseId: string;
    variantId: string;
    qtyToConsume: number;
  }) {
    const { tenantId, orderLineId, warehouseId, variantId, qtyToConsume } = params;
    if (qtyToConsume <= 0) throw new Error("QTY_MUST_BE_POSITIVE");

    const active = await this.db.stockReservation.findMany({
      where: {
        tenantId,
        orderLineId,
        warehouseId,
        variantId,
        status: ReservationStatus.ACTIVE
      },
      orderBy: { createdAt: "asc" }
    });

    const total = active.reduce((sum, r) => sum + r.qty, 0);
    if (total < qtyToConsume) {
      throw new Error(`RESERVATION_SHORTAGE:${orderLineId}`);
    }

    let remaining = qtyToConsume;
    for (const res of active) {
      if (remaining <= 0) break;
      if (res.qty === remaining) {
        await this.db.stockReservation.updateMany({
          where: { tenantId, id: res.id },
          data: { status: ReservationStatus.CONSUMED }
        });
        remaining = 0;
      } else if (res.qty < remaining) {
        await this.db.stockReservation.updateMany({
          where: { tenantId, id: res.id },
          data: { status: ReservationStatus.CONSUMED }
        });
        remaining -= res.qty;
      } else {
        // res.qty > remaining -> split
        await this.db.stockReservation.updateMany({
          where: { tenantId, id: res.id },
          data: { status: ReservationStatus.CONSUMED, qty: remaining }
        });
        await this.db.stockReservation.create({
          data: {
            tenantId,
            orderLineId,
            warehouseId,
            variantId,
            qty: res.qty - remaining,
            status: ReservationStatus.ACTIVE,
            dedupeKey: res.dedupeKey ?? null
          }
        });
        remaining = 0;
      }
    }

    // Snapshot adjustments are handled outside (shipment context) after consumption.
    return qtyToConsume;
  }

  async releaseActiveReservationsForLines(
    tenantId: string,
    warehouseId: string,
    lines: { orderLineId: string; variantId: string; qty: number }[]
  ) {
    for (const line of lines) {
      const active = await this.db.stockReservation.findMany({
        where: {
          tenantId,
          orderLineId: line.orderLineId,
          warehouseId,
          variantId: line.variantId,
          status: ReservationStatus.ACTIVE
        },
        orderBy: { createdAt: "asc" }
      });
      let remaining = line.qty;
      for (const res of active) {
        if (remaining <= 0) break;
        const consumeQty = Math.min(remaining, res.qty);
        await this.db.stockReservation.updateMany({
          where: { tenantId, id: res.id },
          data: { status: ReservationStatus.RELEASED, qty: consumeQty }
        });
        remaining -= consumeQty;
        await this.stock.applySnapshotDelta(tenantId, warehouseId, line.variantId, 0, -consumeQty);
      }
    }
  }
}
