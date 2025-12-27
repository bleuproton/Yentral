// @ts-nocheck
import { prisma } from "../db/prisma";

export class StockSnapshotRepo {
  async get(tenantId: string, warehouseId: string, variantId: string) {
    return prisma.stockSnapshot.findUnique({
      where: { tenantId_warehouseId_variantId: { tenantId, warehouseId, variantId } }
    });
  }

  async upsert(tenantId: string, warehouseId: string, variantId: string, onHand: number, reserved: number, available: number) {
    return prisma.stockSnapshot.upsert({
      where: { tenantId_warehouseId_variantId: { tenantId, warehouseId, variantId } },
      update: { onHand, reserved, available },
      create: { tenantId, warehouseId, variantId, onHand, reserved, available }
    });
  }
}
