import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export class StockLedgerRepository {
  constructor(private readonly db: Prisma.TransactionClient | typeof prisma = prisma) {}

  append(
    tenantId: string,
    warehouseId: string,
    variantId: string,
    qtyDelta: number,
    kind: Prisma.StockLedgerKind,
    reason?: string | null,
    correlationId?: string | null,
    refType?: string | null,
    refId?: string | null
  ) {
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
