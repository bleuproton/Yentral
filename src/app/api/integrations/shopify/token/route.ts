// @ts-nocheck
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { jsonOk, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { prisma } from '@/server/db/prisma';
import { encryptJson } from '@/server/security/crypto';

export const POST = tenantRoute(async ({ req, ctx }) => {
  requireWriteAccess(ctx, 'integration.write');
  const body = await parseJson(req);
  const encrypted = encryptJson({ adminAccessToken: body.adminAccessToken });
  const updated = await prisma.integrationConnection.updateMany({
    where: { tenantId: ctx.tenantId, id: body.connectionId },
    data: { status: 'ACTIVE', config: { shopDomain: body.shopDomain, secrets: encrypted } },
  });
  return jsonOk({ updated: updated.count }, 200);
});
