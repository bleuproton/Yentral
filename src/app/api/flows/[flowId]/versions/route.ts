// @ts-nocheck
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { jsonOk, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { FlowService } from '@/server/services/flowService';

export const GET = tenantRoute(async ({ ctx, params }) => {
  const service = new FlowService();
  const versions = await service.listVersions(ctx, params.flowId);
  return jsonOk(versions);
});

export const POST = tenantRoute(async ({ req, ctx, params }) => {
  requireWriteAccess(ctx, 'flow.write');
  const body = await parseJson(req);
  const service = new FlowService();
  const version = await service.publishVersion(ctx, params.flowId, body.definition ?? body);
  return jsonOk(version, 201);
});
