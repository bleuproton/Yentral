import { ForbiddenError, UnauthorizedError } from '../http/errors';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function requireMembership(tenantId: string, userId?: string | null) {
  if (!userId) throw new UnauthorizedError();
  const membership = await prisma.membership.findUnique({
    where: { userId_tenantId: { userId, tenantId } },
  });
  if (!membership) throw new ForbiddenError('Not a member of tenant');
  return membership;
}

export async function requireRole(tenantId: string, userId: string, roles: Role[]) {
  const membership = await requireMembership(tenantId, userId);
  if (!roles.includes(membership.role)) throw new ForbiddenError('Insufficient role');
  return membership;
}
