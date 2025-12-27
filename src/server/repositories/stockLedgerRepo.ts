// @ts-nocheck
import { StockLedgerKind, Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";

export class StockLedgerRepo {
  async create(entry: {
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
    return prisma.stockLedger.create({
      data: {
        tenantId: entry.tenantId,
        warehouseId: entry.warehouseId,
        variantId: entry.variantId,
        qtyDelta: entry.qtyDelta,
        kind: entry.kind,
        reason: entry.reason ?? null,
        refType: entry.refType ?? null,
        refId: entry.refId ?? null,
        correlationId: entry.correlationId ?? null
      }
    });
  }
}
