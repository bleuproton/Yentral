// @ts-nocheck
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { jsonOk, parseJson } from '@/app/api/_utils';
import { prisma } from '@/server/db/prisma';

export const POST = tenantRoute(async ({ ctx, params, req }) => {
  const body = await parseJson(req);
  const run = await prisma.flowRun.create({
    data: {
      tenantId: ctx.tenantId,
      flowId: params.id,
      flowVersionId: params.id, // placeholder to satisfy relation
      status: 'PENDING',
      input: body?.input ?? {},
      triggerType: body.triggerType ?? 'manual',
      triggerPayload: body.triggerPayload ?? body?.input ?? {},
    },
  });
  return jsonOk(run, 201);
});
