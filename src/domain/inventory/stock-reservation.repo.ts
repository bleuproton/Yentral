import { Prisma, ReservationStatus } from "@prisma/client";
import prisma from "@/lib/prisma";

export class StockReservationRepository {
  constructor(private readonly db: Prisma.TransactionClient | typeof prisma = prisma) {}

  createActive(
    tenantId: string,
    orderLineId: string,
    warehouseId: string,
    variantId: string,
    qty: number,
    dedupeKey?: string | null
  ) {
    return this.db.stockReservation.create({
      data: {
        tenantId,
        orderLineId,
        warehouseId,
        variantId,
        qty,
        status: ReservationStatus.ACTIVE,
        dedupeKey: dedupeKey ?? null
      }
    });
  }

  findByDedupeKey(tenantId: string, dedupeKey: string) {
    return this.db.stockReservation.findFirst({ where: { tenantId, dedupeKey } });
  }

  updateStatus(tenantId: string, reservationId: string, status: ReservationStatus) {
    return this.db.stockReservation.updateMany({
      where: { id: reservationId, tenantId },
      data: { status }
    });
  }

  getById(tenantId: string, reservationId: string) {
    return this.db.stockReservation.findFirst({ where: { id: reservationId, tenantId } });
  }
}
