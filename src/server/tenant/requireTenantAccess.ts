import { PrismaClient } from '@prisma/client';
import { ForbiddenTenantError } from '../http/errors';

export async function requireTenantAccess(prisma: PrismaClient, userId: string, tenantId: string) {
  const membership = await prisma.membership.findUnique({
    where: { userId_tenantId: { userId, tenantId } },
  });
  if (!membership) {
    throw new ForbiddenTenantError();
  }
  return membership.role;
}
