// @ts-nocheck
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { jsonOk, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { FlowService } from '@/server/services/flowService';

export const GET = tenantRoute(async ({ ctx, params }) => {
  const service = new FlowService();
  const flow = await service.getFlow(ctx, params.flowId);
  return jsonOk(flow);
});

export const PATCH = tenantRoute(async ({ req, ctx, params }) => {
  requireWriteAccess(ctx, 'flow.write');
  const body = await parseJson(req);
  const service = new FlowService();
  const flow = await service.updateFlow(ctx, params.flowId, body);
  return jsonOk(flow);
});
