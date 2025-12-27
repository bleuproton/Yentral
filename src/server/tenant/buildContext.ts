import { HttpError } from '@/lib/httpErrors';
import { prisma } from '../db/prisma';
import { resolveAuthFromRequest } from '../auth/resolveAuth';
import { Role, RequestContext } from './context';
import { resolveTenantIdFromRequest } from './resolveTenant';

export async function buildContext(req: Request): Promise<RequestContext> {
  const tenantId = resolveTenantIdFromRequest(req);
  if (!tenantId) {
    throw new HttpError(400, 'TENANT_MISSING', 'Tenant header or cookie required');
  }

  const { userId } = await resolveAuthFromRequest(req);
  let role: Role | undefined;
  if (userId) {
    const membership = await prisma.membership.findFirst({
      where: { tenantId, userId },
      select: { role: true },
    });
    role = (membership?.role as Role | undefined) ?? undefined;
  }

  return { tenantId, userId, role };
}
