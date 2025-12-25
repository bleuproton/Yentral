import { WarehouseMappingRepo } from "../repositories/warehouseMappingRepo";

export class MappingService {
  private repo: WarehouseMappingRepo;

  constructor(repo?: WarehouseMappingRepo) {
    this.repo = repo ?? new WarehouseMappingRepo();
  }

  upsertWarehouseMapping(tenantId: string, connectionId: string, externalLocationId: string, warehouseId: string) {
    return this.repo.upsert(tenantId, connectionId, externalLocationId, warehouseId);
  }

  resolveWarehouse(tenantId: string, connectionId: string, externalLocationId: string) {
    return this.repo.find(tenantId, connectionId, externalLocationId);
  }
}
