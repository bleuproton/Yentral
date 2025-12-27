import { resolveTenantIdBySlug } from '../tenant/tenantService';
import { normalizeTenantId } from '../tenant/context';
import { TenantRequiredError } from '../http/errors';

export async function resolveTenantId(req: Request): Promise<{ tenantId: string; tenantSlug?: string }> {
  const headerTenant = normalizeTenantId(req.headers.get('x-tenant-id'));
  if (headerTenant) return { tenantId: headerTenant };

  const slug = normalizeTenantId(req.headers.get('x-tenant-slug'));
  if (slug) {
    const tenantId = await resolveTenantIdBySlug(slug);
    return { tenantId, tenantSlug: slug };
  }

  throw new TenantRequiredError('Missing tenant context');
}
