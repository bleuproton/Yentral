// @ts-nocheck
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { jsonOk } from '@/app/api/_utils';
import { FlowRunService } from '@/server/services/flowRunService';

export const GET = tenantRoute(async ({ ctx, params }) => {
  const service = new FlowRunService();
  const run = await service.getRun(ctx, params.runId);
  return jsonOk(run);
});
