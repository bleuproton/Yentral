// @ts-nocheck
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { jsonOk, parseJson } from '@/app/api/_utils';
import { prisma } from '@/server/db/prisma';
import { requirePermission } from '@/lib/rbac';

const TYPE_TO_JOB: Record<string, string> = {
  VAT_OSS: 'EXPORT_VAT_OSS',
  GL_JOURNAL: 'EXPORT_GL',
  INVOICE_LIST: 'EXPORT_INVOICES',
};

export const POST = tenantRoute(async ({ ctx, req }) => {
  requirePermission('report.export', ctx.role as any);
  const body = await parseJson(req);
  const type = body.type as string;
  if (!TYPE_TO_JOB[type]) throw new Error('Unsupported export type');
  const report = await prisma.reportExport.create({
    data: {
      tenantId: ctx.tenantId,
      type,
      periodStart: new Date(body.from),
      periodEnd: new Date(body.to),
      status: 'PENDING',
      meta: body.meta ?? {},
    },
  });
  await prisma.job.create({
    data: {
      tenantId: ctx.tenantId,
      type: TYPE_TO_JOB[type],
      payload: { reportExportId: report.id, type },
      status: 'PENDING',
      maxAttempts: 3,
    },
  });
  return jsonOk(report, 202);
});
