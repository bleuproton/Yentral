// @ts-nocheck
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { jsonOk } from '@/app/api/_utils';
import { prisma } from '@/server/db/prisma';

export const GET = tenantRoute(async ({ ctx, params }) => {
  const run = await prisma.flowRun.findUnique({
    where: { tenantId_id: { tenantId: ctx.tenantId, id: params.runId } },
    include: { steps: true, logs: true },
  });
  return jsonOk(run);
});
