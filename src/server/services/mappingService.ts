import prisma from "@/lib/prisma";

export class MappingService {
  async upsertWarehouseMapping(tenantId: string, connectionId: string, externalLocationId: string, warehouseId: string) {
    // validate
    const [connection, warehouse] = await Promise.all([
      prisma.integrationConnection.findFirst({ where: { id: connectionId, tenantId } }),
      prisma.warehouse.findFirst({ where: { id: warehouseId, tenantId } })
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
    return prisma.warehouseMapping.findFirst({
      where: { tenantId, connectionId, externalLocationId }
    });
  }
}
