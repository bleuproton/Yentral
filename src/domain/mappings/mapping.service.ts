import prisma from "@/lib/prisma";
import { WarehouseMappingRepository } from "./warehouse-mapping.repo";

export class MappingService {
  private repo = new WarehouseMappingRepository();

  async upsertWarehouseMapping(tenantId: string, connectionId: string, externalLocationId: string, warehouseId: string) {
    const [connection, warehouse] = await Promise.all([
      prisma.integrationConnection.findFirst({ where: { id: connectionId, tenantId } }),
      prisma.warehouse.findFirst({ where: { id: warehouseId, tenantId } })
    ]);
    if (!connection) throw new Error("CONNECTION_NOT_FOUND");
    if (!warehouse) throw new Error("WAREHOUSE_NOT_FOUND");
    return this.repo.upsert(tenantId, connectionId, externalLocationId, warehouseId);
  }

  resolveWarehouse(tenantId: string, connectionId: string, externalLocationId: string) {
    return this.repo.find(tenantId, connectionId, externalLocationId);
  }
}
