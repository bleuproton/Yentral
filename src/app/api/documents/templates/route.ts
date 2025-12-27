// @ts-nocheck
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { jsonOk, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { prisma } from '@/server/db/prisma';

export const GET = tenantRoute(async ({ ctx }) => {
  const templates = await prisma.documentTemplate.findMany({ where: { tenantId: ctx.tenantId } });
  return jsonOk(templates);
});

export const POST = tenantRoute(async ({ req, ctx }) => {
  requireWriteAccess(ctx, 'document.write');
  const body = await parseJson(req);
  const tpl = await prisma.documentTemplate.create({
    data: { tenantId: ctx.tenantId, key: body.key, name: body.name, type: body.type, templateHtml: body.templateHtml, engine: body.engine ?? null },
  });
  return jsonOk(tpl, 201);
});
