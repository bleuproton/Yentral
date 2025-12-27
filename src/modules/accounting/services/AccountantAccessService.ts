// @ts-nocheck
import { prisma } from '@/server/db/prisma';
import { withContext } from '@/server/tenant/als';
import { RequestContext } from '@/server/tenant/context';

export class AccountantAccessService {
  grantAccess(ctx: RequestContext, userId: string, legalEntityId: string | null, permissions: any) {
    return withContext(ctx, () =>
      prisma.accountantAccess.upsert({
        where: {
          tenantId_userId_legalEntityId: { tenantId: ctx.tenantId, userId, legalEntityId: legalEntityId ?? '' },
        },
        update: { permissions },
        create: { tenantId: ctx.tenantId, userId, legalEntityId: legalEntityId ?? null, permissions },
      })
    );
  }

  listAccess(ctx: RequestContext) {
    return withContext(ctx, () => prisma.accountantAccess.findMany({ where: { tenantId: ctx.tenantId } }));
  }
}
