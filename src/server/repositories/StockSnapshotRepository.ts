import { Prisma } from "@prisma/client";
import prisma from "@/server/db/prisma";

export class StockSnapshotRepository {
  constructor(private readonly db: Prisma.TransactionClient | typeof prisma = prisma) {}

  get(tenantId: string, warehouseId: string, variantId: string) {
    return this.db.stockSnapshot.findUnique({
      where: { tenantId_warehouseId_variantId: { tenantId, warehouseId, variantId } }
    });
  }

  async upsertAndApplyDelta(
    tenantId: string,
    warehouseId: string,
    variantId: string,
    deltaOnHand: number,
    deltaReserved: number
  ) {
    const current = await this.get(tenantId, warehouseId, variantId);
    const onHand = (current?.onHand ?? 0) + deltaOnHand;
    const reserved = (current?.reserved ?? 0) + deltaReserved;
    const available = onHand - reserved;

    return this.db.stockSnapshot.upsert({
      where: { tenantId_warehouseId_variantId: { tenantId, warehouseId, variantId } },
      update: { onHand, reserved, available },
      create: { tenantId, warehouseId, variantId, onHand, reserved, available }
    });
  }
}
