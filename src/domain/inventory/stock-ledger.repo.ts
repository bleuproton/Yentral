// @ts-nocheck
import { Prisma, StockLedgerKind } from "@prisma/client";
import prisma from "@/lib/prisma";

export class StockLedgerRepository {
  constructor(private readonly db: Prisma.TransactionClient | typeof prisma = prisma) {}

  append(options: {
    tenantId: string;
    warehouseId: string;
    variantId: string;
    qtyDelta: number;
    kind: StockLedgerKind;
    reason?: string | null;
    correlationId?: string | null;
    refType?: string | null;
    refId?: string | null;
  }) {
    const { tenantId, warehouseId, variantId, qtyDelta, kind, reason, correlationId, refType, refId } = options;
    return this.db.stockLedger.create({
      data: {
        tenantId,
        warehouseId,
        variantId,
        qtyDelta,
        kind,
        reason: reason ?? null,
        correlationId: correlationId ?? null,
        refType: refType ?? null,
        refId: refId ?? null
      }
    });
  }
}
