// @ts-nocheck
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { jsonOk, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { prisma } from '@/server/db/prisma';

export const GET = tenantRoute(async ({ ctx }) => {
  const exports = await prisma.reportExport.findMany({ where: { tenantId: ctx.tenantId } });
  return jsonOk(exports);
});

export const POST = tenantRoute(async ({ req, ctx }) => {
  requireWriteAccess(ctx, 'report.write');
  const body = await parseJson(req);
  const exportRec = await prisma.reportExport.create({
    data: {
      tenantId: ctx.tenantId,
      type: body.type,
      periodStart: new Date(body.periodStart),
      periodEnd: new Date(body.periodEnd),
      status: 'PENDING',
      meta: body.meta ?? {},
    },
  });
  return jsonOk(exportRec, 201);
});
