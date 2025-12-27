// @ts-nocheck
import { prisma } from '../db';
import { withContext } from '../tenant/als';
import { RequestContext } from '../tenant/context';

export class SecretService {
  upsertSecret(ctx: RequestContext, name: string, value: any) {
    return withContext(ctx, () =>
      prisma.secret.upsert({
        where: { tenantId_name: { tenantId: ctx.tenantId, name } },
        update: { value },
        create: { tenantId: ctx.tenantId, name, value },
      })
    );
  }

  getSecret(ctx: RequestContext, name: string) {
    return withContext(ctx, () =>
      prisma.secret.findUnique({ where: { tenantId_name: { tenantId: ctx.tenantId, name } } })
    );
  }
}
