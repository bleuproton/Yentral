// @ts-nocheck
import { prisma } from '@/server/db/prisma';
import { RequestContext, Role } from '@/server/tenant/context';

const ADMIN_ROLES: Role[] = ['OWNER', 'ADMIN'];

export function assertRole(ctx: RequestContext, allowed: Role[]) {
  if (!ctx.role || !allowed.includes(ctx.role)) {
    throw new Error('Forbidden');
  }
}

export async function assertAccountantAccess(ctx: RequestContext, legalEntityId?: string) {
  if (ctx.role && ADMIN_ROLES.includes(ctx.role)) return;
  const access = await prisma.accountantAccess.findFirst({
    where: { tenantId: ctx.tenantId, userId: ctx.userId ?? '', legalEntityId: legalEntityId ?? undefined },
  });
  if (!access) throw new Error('Accountant access required');
}
