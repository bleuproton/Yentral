import { Prisma, ReservationStatus, StockLedgerKind } from "@prisma/client";
import { prisma } from "../db/prisma";
import { StockLedgerRepo } from "../repositories/stockLedgerRepo";
import { StockSnapshotRepo } from "../repositories/stockSnapshotRepo";
import { StockReservationRepo } from "../repositories/stockReservationRepo";

export class InventoryService {
  private ledger = new StockLedgerRepo();
  private snapshots = new StockSnapshotRepo();
  private reservations = new StockReservationRepo();

  private async computeSnapshot(tenantId: string, warehouseId: string, variantId: string, deltaOnHand: number, deltaReserved: number) {
    const current = await this.snapshots.get(tenantId, warehouseId, variantId);
    const onHand = (current?.onHand ?? 0) + deltaOnHand;
    const reserved = (current?.reserved ?? 0) + deltaReserved;
    const available = onHand - reserved;
    return { onHand, reserved, available };
  }

  async adjustStock(
    tenantId: string,
    warehouseId: string,
    variantId: string,
    qtyDelta: number,
    kind: StockLedgerKind,
    reason?: string,
    refType?: string,
    refId?: string,
    correlationId?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const { onHand, reserved, available } = await this.computeSnapshot(tenantId, warehouseId, variantId, qtyDelta, 0);
      const ledger = await tx.stockLedger.create({
        data: {
          tenantId,
          warehouseId,
          variantId,
          qtyDelta,
          kind,
          reason: reason ?? null,
          refType: refType ?? null,
          refId: refId ?? null,
          correlationId: correlationId ?? null
        }
      });
      const snapshot = await tx.stockSnapshot.upsert({
        where: { tenantId_warehouseId_variantId: { tenantId, warehouseId, variantId } },
        update: { onHand, reserved, available },
        create: { tenantId, warehouseId, variantId, onHand, reserved, available }
      });
      return { ledger, snapshot };
    });
  }

  async reserveStock(tenantId: string, orderLineId: string, warehouseId: string, variantId: string, qty: number, dedupeKey?: string) {
    if (dedupeKey) {
      const found = await this.reservations.findActive(tenantId, { dedupeKey });
      if (found) return { reservation: found, reused: true };
    } else {
      const found = await this.reservations.findActive(tenantId, { orderLineId, warehouseId, variantId });
      if (found) return { reservation: found, reused: true };
    }

    return prisma.$transaction(async (tx) => {
      const reservation = await tx.stockReservation.create({
        data: {
          tenantId,
          orderLineId,
          warehouseId,
          variantId,
          qty,
          status: ReservationStatus.ACTIVE,
          dedupeKey
        }
      });

      // Ledger with qtyDelta=0 just to record the event
      await tx.stockLedger.create({
        data: {
          tenantId,
          warehouseId,
          variantId,
          qtyDelta: 0,
          kind: StockLedgerKind.RESERVE,
          refType: "OrderLine",
          refId: orderLineId
        }
      });

      const { onHand, reserved, available } = await this.computeSnapshot(tenantId, warehouseId, variantId, 0, qty);
      const snapshot = await tx.stockSnapshot.upsert({
        where: { tenantId_warehouseId_variantId: { tenantId, warehouseId, variantId } },
        update: { onHand, reserved, available },
        create: { tenantId, warehouseId, variantId, onHand, reserved, available }
      });

      return { reservation, snapshot, reused: false };
    });
  }

  async releaseReservation(tenantId: string, reservationId: string) {
    return prisma.$transaction(async (tx) => {
      const reservation = await tx.stockReservation.findFirst({ where: { id: reservationId, tenantId } });
      if (!reservation) throw new Error("Reservation not found");

      await tx.stockReservation.update({
        where: { id: reservationId },
        data: { status: ReservationStatus.RELEASED }
      });

      await tx.stockLedger.create({
        data: {
          tenantId,
          warehouseId: reservation.warehouseId,
          variantId: reservation.variantId,
          qtyDelta: 0,
          kind: StockLedgerKind.RELEASE,
          refType: "Reservation",
          refId: reservationId
        }
      });

      const { onHand, reserved, available } = await this.computeSnapshot(
        tenantId,
        reservation.warehouseId,
        reservation.variantId,
        0,
        -reservation.qty
      );
      const snapshot = await tx.stockSnapshot.upsert({
        where: {
          tenantId_warehouseId_variantId: {
            tenantId,
            warehouseId: reservation.warehouseId,
            variantId: reservation.variantId
          }
        },
        update: { onHand, reserved, available },
        create: {
          tenantId,
          warehouseId: reservation.warehouseId,
          variantId: reservation.variantId,
          onHand,
          reserved,
          available
        }
      });

      return { reservationId, snapshot };
    });
  }

  async consumeReservation(tenantId: string, reservationId: string) {
    return prisma.$transaction(async (tx) => {
      const reservation = await tx.stockReservation.findFirst({ where: { id: reservationId, tenantId } });
      if (!reservation) throw new Error("Reservation not found");

      await tx.stockReservation.update({
        where: { id: reservationId },
        data: { status: ReservationStatus.CONSUMED }
      });

      await tx.stockLedger.create({
        data: {
          tenantId,
          warehouseId: reservation.warehouseId,
          variantId: reservation.variantId,
          qtyDelta: -reservation.qty,
          kind: StockLedgerKind.SHIP,
          refType: "Reservation",
          refId: reservationId
        }
      });

      const { onHand, reserved, available } = await this.computeSnapshot(
        tenantId,
        reservation.warehouseId,
        reservation.variantId,
        -reservation.qty,
        -reservation.qty
      );
      const snapshot = await tx.stockSnapshot.upsert({
        where: {
          tenantId_warehouseId_variantId: {
            tenantId,
            warehouseId: reservation.warehouseId,
            variantId: reservation.variantId
          }
        },
        update: { onHand, reserved, available },
        create: {
          tenantId,
          warehouseId: reservation.warehouseId,
          variantId: reservation.variantId,
          onHand,
          reserved,
          available
        }
      });

      return { reservationId, snapshot };
    });
  }
}
