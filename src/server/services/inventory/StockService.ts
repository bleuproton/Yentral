// @ts-nocheck
import { Prisma, StockLedgerKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { applyDelta, computeAvailable } from "./StockMath";

export class StockService {
  constructor(private readonly db: Prisma.TransactionClient | typeof prisma = prisma) {}

  async ensureSnapshot(tenantId: string, warehouseId: string, variantId: string) {
    return this.db.stockSnapshot.upsert({
      where: { tenantId_warehouseId_variantId: { tenantId, warehouseId, variantId } },
      update: {},
      create: { tenantId, warehouseId, variantId, onHand: 0, reserved: 0, available: 0 }
    });
  }

  async applySnapshotDelta(tenantId: string, warehouseId: string, variantId: string, deltaOnHand: number, deltaReserved: number) {
    const existing = await this.db.stockSnapshot.findUnique({
      where: { tenantId_warehouseId_variantId: { tenantId, warehouseId, variantId } }
    });
    if (!existing) {
      const onHand = deltaOnHand;
      const reserved = deltaReserved;
      const available = computeAvailable(onHand, reserved);
      return this.db.stockSnapshot.create({
        data: { tenantId, warehouseId, variantId, onHand, reserved, available }
      });
    }

    const next = applyDelta(existing, deltaOnHand, deltaReserved);
    return this.db.stockSnapshot.update({
      where: { tenantId_warehouseId_variantId: { tenantId, warehouseId, variantId } },
      data: {
        onHand: next.onHand,
        reserved: next.reserved,
        available: next.available
      }
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
}
