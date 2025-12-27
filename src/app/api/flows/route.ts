// @ts-nocheck
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { jsonOk, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { FlowService } from '@/server/services/flowService';

export const GET = tenantRoute(async ({ ctx }) => {
  const service = new FlowService();
  const flows = await service.listFlows(ctx);
  return jsonOk(flows);
});

export const POST = tenantRoute(async ({ req, ctx }) => {
  requireWriteAccess(ctx, 'flow.write');
  const body = await parseJson(req);
  const service = new FlowService();
  const flow = await service.createFlow(ctx, body);
  return jsonOk(flow, 201);
});
