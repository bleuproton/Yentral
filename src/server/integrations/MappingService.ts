// @ts-nocheck
import prisma from "@/server/db/prisma";

export class MappingService {
  async upsertWarehouseMapping(tenantId: string, connectionId: string, externalLocationId: string, warehouseId: string) {
    const [connection, warehouse] = await Promise.all([
      prisma.integrationConnection.findFirst({ where: { tenantId, id: connectionId } }),
      prisma.warehouse.findFirst({ where: { tenantId, id: warehouseId } })
    ]);
    if (!connection) throw new Error("CONNECTION_NOT_FOUND");
    if (!warehouse) throw new Error("WAREHOUSE_NOT_FOUND");

    return prisma.warehouseMapping.upsert({
      where: { tenantId_connectionId_externalLocationId: { tenantId, connectionId, externalLocationId } },
      update: { warehouseId },
      create: { tenantId, connectionId, externalLocationId, warehouseId }
    });
  }

  resolveWarehouse(tenantId: string, connectionId: string, externalLocationId: string) {
    return prisma.warehouseMapping.findUnique({
      where: { tenantId_connectionId_externalLocationId: { tenantId, connectionId, externalLocationId } }
    });
  }
}
