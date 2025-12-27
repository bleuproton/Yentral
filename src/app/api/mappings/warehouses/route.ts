// @ts-nocheck
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { jsonOk, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { MappingService } from '@/server/services/mappingService';

export const POST = tenantRoute(async ({ req, ctx }) => {
  requireWriteAccess(ctx, 'integration.write');
  const body = await parseJson(req);
  const { connectionId, externalLocationId, warehouseId } = body;
  const service = new MappingService();
  const mapping = await service.upsertWarehouseMapping(ctx, connectionId, externalLocationId, warehouseId);
  return jsonOk(mapping);
});
