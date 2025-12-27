// @ts-nocheck
import { Prisma, ReservationStatus, StockLedgerKind } from "@prisma/client";
import prisma from "@/server/db/prisma";
import { StockLedgerRepository } from "../repositories/StockLedgerRepository";
import { StockSnapshotRepository } from "../repositories/StockSnapshotRepository";
import { StockReservationRepository } from "../repositories/StockReservationRepository";

type AdjustInput = {
  tenantId: string;
  warehouseId: string;
  variantId: string;
  qtyDelta: number;
  reason?: string | null;
  correlationId?: string | null;
};

type ReserveInput = {
  tenantId: string;
  orderLineId: string;
  warehouseId: string;
  variantId: string;
  qty: number;
  dedupeKey?: string | null;
  correlationId?: string | null;
};

type ReservationResult = {
  reservation: Awaited<ReturnType<StockReservationRepository["createActive"]>>;
  reused: boolean;
};

export class InventoryService {
  private ledger = new StockLedgerRepository();
  private snapshot = new StockSnapshotRepository();
  private reservations = new StockReservationRepository();

  async adjustStock(input: AdjustInput) {
    const { tenantId, warehouseId, variantId, qtyDelta, reason, correlationId } = input;
    return prisma.$transaction(async (tx) => {
      const ledgerRepo = new StockLedgerRepository(tx);
      const snapshotRepo = new StockSnapshotRepository(tx);

      await ledgerRepo.append(
        tenantId,
        warehouseId,
        variantId,
        qtyDelta,
        StockLedgerKind.ADJUST,
        reason ?? null,
        correlationId ?? null
      );
      const snap = await snapshotRepo.upsertAndApplyDelta(tenantId, warehouseId, variantId, qtyDelta, 0);
      return snap;
    });
  }

  async reserveStock(input: ReserveInput): Promise<ReservationResult> {
    const { tenantId, orderLineId, warehouseId, variantId, qty, dedupeKey, correlationId } = input;

    return prisma.$transaction(async (tx) => {
      const reservationRepo = new StockReservationRepository(tx);
      const ledgerRepo = new StockLedgerRepository(tx);
      const snapshotRepo = new StockSnapshotRepository(tx);

      if (dedupeKey) {
        const existing = await reservationRepo.findByDedupeKey(tenantId, dedupeKey);
        if (existing) {
          return { reservation: existing, reused: true };
        }
      }

      const snap = await snapshotRepo.get(tenantId, warehouseId, variantId);
      const available = snap ? snap.available : 0;
      if (available < qty) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      const reservation = await reservationRepo.createActive(tenantId, orderLineId, warehouseId, variantId, qty, dedupeKey);

      // Ledger: RESERVE with qtyDelta=0 (we track reservation movement via snapshot reserved)
      await ledgerRepo.append(tenantId, warehouseId, variantId, 0, StockLedgerKind.RESERVE, null, correlationId ?? null, "OrderLine", orderLineId);

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
      if (!reservation || reservation.status !== ReservationStatus.ACTIVE) {
        return null;
      }

      await reservationRepo.updateStatus(tenantId, reservationId, ReservationStatus.RELEASED);
      await ledgerRepo.append(
        tenantId,
        reservation.warehouseId,
        reservation.variantId,
        0,
        StockLedgerKind.RELEASE,
        null,
        correlationId ?? null,
        "Reservation",
        reservationId
      );
      const snap = await snapshotRepo.upsertAndApplyDelta(
        tenantId,
        reservation.warehouseId,
        reservation.variantId,
        0,
        -reservation.qty
      );
      return snap;
    });
  }

  async consumeReservation(tenantId: string, reservationId: string, correlationId?: string | null) {
    return prisma.$transaction(async (tx) => {
      const reservationRepo = new StockReservationRepository(tx);
      const ledgerRepo = new StockLedgerRepository(tx);
      const snapshotRepo = new StockSnapshotRepository(tx);

      const reservation = await reservationRepo.getById(tenantId, reservationId);
      if (!reservation || reservation.status !== ReservationStatus.ACTIVE) {
        return null;
      }

      await reservationRepo.updateStatus(tenantId, reservationId, ReservationStatus.CONSUMED);
      await ledgerRepo.append(
        tenantId,
        reservation.warehouseId,
        reservation.variantId,
        -reservation.qty,
        StockLedgerKind.SHIP,
        null,
        correlationId ?? null,
        "Reservation",
        reservationId
      );
      const snap = await snapshotRepo.upsertAndApplyDelta(
        tenantId,
        reservation.warehouseId,
        reservation.variantId,
        -reservation.qty,
        -reservation.qty
      );
      return snap;
    });
  }

  async getAvailability(tenantId: string, warehouseId: string, variantId: string) {
    const snap = await this.snapshot.get(tenantId, warehouseId, variantId);
    if (!snap) return { onHand: 0, reserved: 0, available: 0 };
    return { onHand: snap.onHand, reserved: snap.reserved, available: snap.available };
  }
}
