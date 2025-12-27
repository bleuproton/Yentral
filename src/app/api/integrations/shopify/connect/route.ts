// @ts-nocheck
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { jsonOk, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { prisma } from '@/server/db/prisma';

export const POST = tenantRoute(async ({ req, ctx }) => {
  requireWriteAccess(ctx, 'integration.write');
  const body = await parseJson(req);
  const connection = await prisma.integrationConnection.create({
    data: {
      tenantId: ctx.tenantId,
      connectorVersionId: body.connectorVersionId,
      status: 'INACTIVE',
      name: body.name ?? 'Shopify',
      region: body.shopDomain,
      config: { shopDomain: body.shopDomain },
    },
  });
  return jsonOk(connection, 201);
});
