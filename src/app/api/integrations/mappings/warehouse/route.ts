import { NextRequest } from 'next/server';
import { buildContext } from '@/server/tenant/buildContext';
import { jsonOk, jsonError, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { MappingService } from '@/server/services/mappingService';
import { WarehouseMappingUpsertSchema } from '@/server/validators/integration';

export async function POST(req: NextRequest) {
  try {
    const ctx = await buildContext(req);
    requireWriteAccess(ctx, 'integration.write');
    const body = WarehouseMappingUpsertSchema.parse(await parseJson(req));
    const svc = new MappingService();
    const mapping = await svc.upsertWarehouseMapping(ctx, body.connectionId, body.externalLocationId, body.warehouseId);
    return jsonOk(mapping, 201);
  } catch (err) {
    return jsonError(err);
  }
}
