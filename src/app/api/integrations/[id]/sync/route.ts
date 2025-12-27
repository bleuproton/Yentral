// @ts-nocheck
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { jsonOk, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { prisma } from '@/server/db/prisma';

export const POST = tenantRoute(async ({ req, ctx, params }) => {
  requireWriteAccess(ctx, 'integration.write');
  const body = (await parseJson(req)) || {};
  const scope = body.scope || 'catalog';
  const dedupeKey = `integration.sync:${ctx.tenantId}:${params.id}:${scope}`;
  const job = await prisma.job.upsert({
    where: { tenantId_dedupeKey: { tenantId: ctx.tenantId, dedupeKey } },
    update: { status: 'PENDING', payload: { connectionId: params.id, scope }, nextRunAt: new Date() },
    create: {
      tenantId: ctx.tenantId,
      type: 'integration.sync',
      payload: { connectionId: params.id, scope },
      dedupeKey,
      maxAttempts: 5,
      status: 'PENDING',
    },
  });
  return jsonOk(job, 202);
});
