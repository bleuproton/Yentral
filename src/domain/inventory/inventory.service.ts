import { Prisma, ReservationStatus, StockLedgerKind } from "@prisma/client";
import prisma from "@/lib/prisma";
import { StockLedgerRepository } from "./stock-ledger.repo";
import { StockSnapshotRepository } from "./stock-snapshot.repo";
import { StockReservationRepository } from "./stock-reservation.repo";
import { AdjustStockInput, ReserveStockInput } from "./types";

export class InventoryService {
  private ledger = new StockLedgerRepository();
  private snapshot = new StockSnapshotRepository();
  private reservations = new StockReservationRepository();

  async adjustStock(input: AdjustStockInput) {
    const { tenantId, warehouseId, variantId, qtyDelta, kind, reason, correlationId, refType, refId } = input;
    return prisma.$transaction(async (tx) => {
      const ledgerRepo = new StockLedgerRepository(tx);
      const snapshotRepo = new StockSnapshotRepository(tx);

      await ledgerRepo.append({
        tenantId,
        warehouseId,
        variantId,
        qtyDelta,
        kind,
        reason: reason ?? null,
        correlationId: correlationId ?? null,
        refType: refType ?? null,
        refId: refId ?? null
      });

      return snapshotRepo.upsertAndApplyDelta(tenantId, warehouseId, variantId, qtyDelta, 0);
    });
  }

  async reserveStock(input: ReserveStockInput) {
    const { tenantId, orderLineId, warehouseId, variantId, qty, dedupeKey, correlationId } = input;

    return prisma.$transaction(async (tx) => {
      const reservationRepo = new StockReservationRepository(tx);
      const ledgerRepo = new StockLedgerRepository(tx);
      const snapshotRepo = new StockSnapshotRepository(tx);

      if (dedupeKey) {
        const found = await reservationRepo.findByDedupeKey(tenantId, dedupeKey);
        if (found) return { reservation: found, reused: true };
      }

      const snap = await snapshotRepo.get(tenantId, warehouseId, variantId);
      const available = snap ? snap.available : 0;
      if (available < qty) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      const reservation = await reservationRepo.createActive(tenantId, orderLineId, warehouseId, variantId, qty, dedupeKey);

      await ledgerRepo.append({
        tenantId,
        warehouseId,
        variantId,
        qtyDelta: 0,
        kind: StockLedgerKind.RESERVE,
        correlationId: correlationId ?? null,
        refType: "OrderLine",
        refId: orderLineId
      });

      await snapshotRepo.upsertAndApplyDelta(tenantId, warehouseId, variantId, 0, qty);

      return { reservation, reused: false };
    });
  }

  async releaseReservation(tenantId: string, reservationId: string, correlationId?: string | null) {
    return prisma.$transaction(async (tx) => {
      const reservationRepo = new StockReservationRepository(tx);
      const ledgerRepo = new StockLedgerRepository(tx);
      const snapshotRepo = new StockSnapshotRepository(tx);

      const reservation = await reservationRepo.getById(tenantId, reservationId);
      if (!reservation || reservation.status !== ReservationStatus.ACTIVE) return null;

      await reservationRepo.updateStatus(tenantId, reservationId, ReservationStatus.RELEASED);
      await ledgerRepo.append({
        tenantId,
        warehouseId: reservation.warehouseId,
        variantId: reservation.variantId,
        qtyDelta: 0,
        kind: StockLedgerKind.RELEASE,
        correlationId: correlationId ?? null,
        refType: "Reservation",
        refId: reservationId
      });
      return snapshotRepo.upsertAndApplyDelta(
        tenantId,
        reservation.warehouseId,
        reservation.variantId,
        0,
        -reservation.qty
      );
    });
  }

  async consumeReservation(tenantId: string, reservationId: string, correlationId?: string | null) {
    return prisma.$transaction(async (tx) => {
      const reservationRepo = new StockReservationRepository(tx);
      const ledgerRepo = new StockLedgerRepository(tx);
      const snapshotRepo = new StockSnapshotRepository(tx);

      const reservation = await reservationRepo.getById(tenantId, reservationId);
      if (!reservation || reservation.status !== ReservationStatus.ACTIVE) return null;

      await reservationRepo.updateStatus(tenantId, reservationId, ReservationStatus.CONSUMED);
      await ledgerRepo.append({
        tenantId,
        warehouseId: reservation.warehouseId,
        variantId: reservation.variantId,
        qtyDelta: -reservation.qty,
        kind: StockLedgerKind.SHIP,
        correlationId: correlationId ?? null,
        refType: "Reservation",
        refId: reservationId
      });

      return snapshotRepo.upsertAndApplyDelta(
        tenantId,
        reservation.warehouseId,
        reservation.variantId,
        -reservation.qty,
        -reservation.qty
      );
    });
  }

  async getAvailability(tenantId: string, warehouseId: string, variantId: string) {
    const snap = await this.snapshot.get(tenantId, warehouseId, variantId);
    if (!snap) return { onHand: 0, reserved: 0, available: 0 };
    return { onHand: snap.onHand, reserved: snap.reserved, available: snap.available };
  }
}
