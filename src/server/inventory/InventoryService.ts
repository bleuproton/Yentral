// @ts-nocheck
import { Prisma, ReservationStatus, StockLedgerKind } from "@prisma/client";
import prisma from "@/server/db/prisma";
import { StockLedgerRepository } from "./StockLedgerRepository";
import { StockSnapshotRepository } from "./StockSnapshotRepository";
import { StockReservationRepository } from "./StockReservationRepository";

type AdjustInput = {
  tenantId: string;
  warehouseId: string;
  variantId: string;
  qtyDelta: number;
  kind: StockLedgerKind;
  reason?: string | null;
  correlationId?: string | null;
  refType?: string | null;
  refId?: string | null;
};

type ReserveInput = {
  tenantId: string;
  orderLineId: string;
  warehouseId: string;
  variantId: string;
  qty: number;
  dedupeKey?: string | null;
};

type AvailabilityInput = {
  tenantId: string;
  warehouseId: string;
  variantId: string;
};

export class InventoryService {
  private ledger = new StockLedgerRepository();
  private snapshot = new StockSnapshotRepository();
  private reservations = new StockReservationRepository();

  async adjustStock(input: AdjustInput) {
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

  async reserve(input: ReserveInput) {
    const { tenantId, orderLineId, warehouseId, variantId, qty, dedupeKey } = input;
    return prisma.$transaction(async (tx) => {
      const reservationRepo = new StockReservationRepository(tx);
      const ledgerRepo = new StockLedgerRepository(tx);
      const snapshotRepo = new StockSnapshotRepository(tx);

      if (dedupeKey) {
        const existing = await reservationRepo.findByDedupeKey(tenantId, dedupeKey);
        if (existing) return { reservation: existing, reused: true };
      }

      const snap = await snapshotRepo.get(tenantId, warehouseId, variantId);
      const available = snap ? snap.available : 0;
      if (available < qty) throw new Error("INSUFFICIENT_STOCK");

      const reservation = await reservationRepo.createActive(tenantId, orderLineId, warehouseId, variantId, qty, dedupeKey);

      await ledgerRepo.append({
        tenantId,
        warehouseId,
        variantId,
        qtyDelta: 0,
        kind: StockLedgerKind.RESERVE,
        refType: "OrderLine",
        refId: orderLineId
      });

      await snapshotRepo.upsertAndApplyDelta(tenantId, warehouseId, variantId, 0, qty);

      return { reservation, reused: false };
    });
  }

  async releaseReservation(params: { tenantId: string; reservationId: string }) {
    const { tenantId, reservationId } = params;
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

  async consumeReservation(params: { tenantId: string; reservationId: string }) {
    const { tenantId, reservationId } = params;
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

  async getAvailability(input: AvailabilityInput) {
    const { tenantId, warehouseId, variantId } = input;
    const snap = await this.snapshot.get(tenantId, warehouseId, variantId);
    return {
      onHand: snap?.onHand ?? 0,
      reserved: snap?.reserved ?? 0,
      available: snap?.available ?? 0
    };
  }

  /**
   * Rebuild snapshot from ledger + active reservations for a variant+warehouse.
   */
  async rebuildSnapshotForVariant(input: AvailabilityInput) {
    const { tenantId, warehouseId, variantId } = input;
    const ledgerSum = await this.ledger.sumQty(tenantId, warehouseId, variantId);
    const reservationSum = await this.reservations.sumActiveQty(tenantId, warehouseId, variantId);
    const onHand = ledgerSum._sum.qtyDelta ?? 0;
    const reserved = reservationSum._sum.qty ?? 0;
    return this.snapshot.upsert(tenantId, warehouseId, variantId, onHand, reserved);
  }
}
