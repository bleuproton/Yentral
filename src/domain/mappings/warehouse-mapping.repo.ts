import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export class WarehouseMappingRepository {
  constructor(private readonly db: Prisma.TransactionClient | typeof prisma = prisma) {}

  upsert(tenantId: string, connectionId: string, externalLocationId: string, warehouseId: string) {
    return this.db.warehouseMapping.upsert({
      where: { tenantId_connectionId_externalLocationId: { tenantId, connectionId, externalLocationId } },
      update: { warehouseId },
      create: { tenantId, connectionId, externalLocationId, warehouseId }
    });
  }

  find(tenantId: string, connectionId: string, externalLocationId: string) {
    return this.db.warehouseMapping.findFirst({ where: { tenantId, connectionId, externalLocationId } });
  }
}
