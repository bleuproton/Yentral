// @ts-nocheck
import { RequestContext } from '../tenant/context';
import { MappingRepo } from '../repos/mappingRepo';

export class MappingService {
  private repo = new MappingRepo();

  upsertWarehouseMapping(ctx: RequestContext, connectionId: string, externalLocationId: string, warehouseId: string) {
    return this.repo.upsertWarehouseMapping(ctx, connectionId, externalLocationId, warehouseId);
  }

  resolveWarehouse(ctx: RequestContext, connectionId: string, externalLocationId: string) {
    return this.repo.resolveWarehouse(ctx, connectionId, externalLocationId);
  }
}
