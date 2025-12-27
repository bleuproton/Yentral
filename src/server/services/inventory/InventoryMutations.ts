// @ts-nocheck
import { Prisma, ReservationStatus, StockLedgerKind } from "@prisma/client";
import prisma from "@/server/db/prisma";

export class InventoryMutations {
  constructor(private readonly db: Prisma.TransactionClient | typeof prisma = prisma) {}

  async ensureSnapshot(tenantId: string, warehouseId: string, variantId: string) {
    return this.db.stockSnapshot.upsert({
      where: { tenantId_warehouseId_variantId: { tenantId, warehouseId, variantId } },
      update: {},
      create: { tenantId, warehouseId, variantId, onHand: 0, reserved: 0, available: 0 }
    });
  }

  ledger(params: {
    tenantId: string;
    warehouseId: string;
    variantId: string;
    qtyDelta: number;
    kind: StockLedgerKind;
    reason?: string | null;
    refType?: string | null;
    refId?: string | null;
    correlationId?: string | null;
  }) {
    const { tenantId, warehouseId, variantId, qtyDelta, kind, reason, refType, refId, correlationId } = params;
    return this.db.stockLedger.create({
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
  }

  async reserve(params: {
    tenantId: string;
    orderLineId: string;
    warehouseId: string;
    variantId: string;
    qty: number;
    dedupeKey?: string | null;
  }) {
    const { tenantId, orderLineId, warehouseId, variantId, qty, dedupeKey } = params;
    await this.ensureSnapshot(tenantId, warehouseId, variantId);
    const reservation = await this.db.stockReservation.create({
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
    await this.db.stockSnapshot.update({
      where: { tenantId_warehouseId_variantId: { tenantId, warehouseId, variantId } },
      data: {
        reserved: { increment: qty },
        available: { decrement: qty }
      }
    });
    return reservation;
  }

  async releaseReservation(params: { tenantId: string; reservationId: string }) {
    const { tenantId, reservationId } = params;
    const res = await this.db.stockReservation.findFirst({ where: { tenantId, id: reservationId } });
    if (!res || res.status !== ReservationStatus.ACTIVE) return null;

    await this.db.stockReservation.updateMany({
      where: { tenantId, id: reservationId },
      data: { status: ReservationStatus.RELEASED }
    });
    await this.db.stockSnapshot.update({
      where: { tenantId_warehouseId_variantId: { tenantId, warehouseId: res.warehouseId, variantId: res.variantId } },
      data: {
        reserved: { decrement: res.qty },
        available: { increment: res.qty }
      }
    });
    return res;
  }

  async shipFromReserved(params: { tenantId: string; warehouseId: string; variantId: string; qty: number; refId?: string | null }) {
    const { tenantId, warehouseId, variantId, qty, refId } = params;
    await this.ensureSnapshot(tenantId, warehouseId, variantId);
    await this.db.stockSnapshot.update({
      where: { tenantId_warehouseId_variantId: { tenantId, warehouseId, variantId } },
      data: {
        onHand: { decrement: qty },
        reserved: { decrement: qty },
        available: { decrement: 0 }
      }
    });
    await this.ledger({
      tenantId,
      warehouseId,
      variantId,
      qtyDelta: -qty,
      kind: StockLedgerKind.SHIP,
      refType: "ShipmentLine",
      refId: refId ?? null
    });
  }

  async receiveReturn(params: { tenantId: string; warehouseId: string; variantId: string; qty: number; refId?: string | null }) {
    const { tenantId, warehouseId, variantId, qty, refId } = params;
    await this.ensureSnapshot(tenantId, warehouseId, variantId);
    await this.db.stockSnapshot.update({
      where: { tenantId_warehouseId_variantId: { tenantId, warehouseId, variantId } },
      data: {
        onHand: { increment: qty },
        available: { increment: qty }
      }
    });
    await this.ledger({
      tenantId,
      warehouseId,
      variantId,
      qtyDelta: qty,
      kind: StockLedgerKind.RETURN,
      refType: "ReturnLine",
      refId: refId ?? null
    });
  }
}
