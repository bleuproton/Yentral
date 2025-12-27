import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { resolveTenantIdBySlug } from '../tenant/tenantService';
import { TenantRequiredError } from '../http/errors';

type Cached = { tenantId: string; expiresAt: number };
const slugCache = new Map<string, Cached>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export type RequestContext = {
  tenantId: string;
  tenantSlug?: string;
  actorUserId?: string | null;
  requestId: string;
};

export async function getRequestContext(req: Request): Promise<RequestContext> {
  const headers = req.headers;
  const requestId = headers.get('x-request-id') || randomUUID();
  const tenantId = headers.get('x-tenant-id') || undefined;
  const tenantSlug = headers.get('x-tenant-slug') || undefined;
  let resolvedTenantId = tenantId;

  if (!resolvedTenantId && tenantSlug) {
    resolvedTenantId = await cachedTenantIdForSlug(tenantSlug);
  }

  if (!resolvedTenantId) {
    throw new TenantRequiredError('Missing tenantId (x-tenant-id) or tenant slug (x-tenant-slug)');
  }

  const session = await getServerSession(authOptions).catch(() => null);
  const actorUserId = (session as any)?.user?.id ?? null;

  return { tenantId: resolvedTenantId, tenantSlug, actorUserId, requestId };
}

export function requireTenant(ctx: RequestContext) {
  if (!ctx.tenantId) throw new TenantRequiredError();
}

async function cachedTenantIdForSlug(slug: string): Promise<string> {
  const now = Date.now();
  const cached = slugCache.get(slug);
  if (cached && cached.expiresAt > now) return cached.tenantId;
  const tenantId = await resolveTenantIdBySlug(slug);
  slugCache.set(slug, { tenantId, expiresAt: now + CACHE_TTL_MS });
  return tenantId;
}
