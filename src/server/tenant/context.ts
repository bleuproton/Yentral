import { forbidden } from '@/lib/httpErrors';

export type Role = 'OWNER' | 'ADMIN' | 'MEMBER';

export type RequestContext = {
  tenantId: string;
  userId?: string;
  role?: Role;
};

export function requireTenant(ctx: RequestContext) {
  if (!ctx.tenantId) {
    throw forbidden('Tenant required');
  }
}

export function requireRole(ctx: RequestContext, allowed: Role[]) {
  if (!ctx.role || !allowed.includes(ctx.role)) {
    throw forbidden('Insufficient role');
  }
}

export function normalizeTenantId(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
