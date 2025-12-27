import { TenantRequiredError } from '../http/errors';
import { normalizeTenantId } from './context';
import { resolveTenantIdBySlug } from './tenantService';

export function resolveTenantIdFromRequest(req: Request): string | null {
  const headerTenant = normalizeTenantId(req.headers.get('x-tenant-id'));
  if (headerTenant) return headerTenant;

  const headerSlug = normalizeTenantId(req.headers.get('x-tenant-slug'));
  if (headerSlug) {
    return headerSlug;
  }

  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader
      .split(';')
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => {
        const [k, ...rest] = c.split('=');
        return [k, rest.join('=')];
      })
  );
  const cookieTenant = normalizeTenantId(cookies['tenantId']);
  if (cookieTenant) return cookieTenant;

  const url = new URL(req.url);
  const qp = normalizeTenantId(url.searchParams.get('tenantId'));
  if (qp) return qp;

  return null;
}

export function resolveTenantId(params: Record<string, any> | undefined, req: Request): string {
  if (params?.tenantId) return String(params.tenantId);
  const header = resolveTenantIdFromRequest(req);
  if (header) return header;
  throw new TenantRequiredError();
}

export async function resolveTenantIdWithSlug(params: Record<string, any> | undefined, req: Request): Promise<string> {
  if (params?.tenantId) return String(params.tenantId);
  const headerTenant = normalizeTenantId(req.headers.get('x-tenant-id'));
  if (headerTenant) return headerTenant;
  const slug = normalizeTenantId(req.headers.get('x-tenant-slug'));
  if (slug) {
    return resolveTenantIdBySlug(slug);
  }
  const cookieTenant = resolveTenantIdFromRequest(req);
  if (cookieTenant) return cookieTenant;
  throw new TenantRequiredError();
}
