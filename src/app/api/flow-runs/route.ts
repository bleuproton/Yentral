// @ts-nocheck
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { jsonOk, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { FlowRunService } from '@/server/services/flowRunService';

export const GET = tenantRoute(async ({ ctx, req }) => {
  const search = req.nextUrl.searchParams;
  const flowId = search.get('flowId') || undefined;
  const status = search.get('status') || undefined;
  const service = new FlowRunService();
  const runs = await service.listRuns(ctx, { flowId, status });
  return jsonOk(runs);
});

export const POST = tenantRoute(async ({ req, ctx }) => {
  requireWriteAccess(ctx, 'flow.write');
  const body = await parseJson(req);
  const service = new FlowRunService();
  const run = await service.startRun(ctx, body.flowId, body.input ?? {});
  return jsonOk(run, 201);
});
