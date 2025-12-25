import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../db/prisma";

export class WarehouseMappingRepo {
  constructor(private db: PrismaClient | Prisma.TransactionClient = prisma) {}

  async upsert(tenantId: string, connectionId: string, externalLocationId: string, warehouseId: string) {
    return this.db.warehouseMapping.upsert({
      where: {
        tenantId_connectionId_externalLocationId: { tenantId, connectionId, externalLocationId }
      },
      update: { warehouseId },
      create: { tenantId, connectionId, externalLocationId, warehouseId }
    });
  }

  async find(tenantId: string, connectionId: string, externalLocationId: string) {
    return this.db.warehouseMapping.findFirst({
      where: { tenantId, connectionId, externalLocationId }
    });
  }
}
