import { TenantRequiredError } from '../http/errors';

export function resolveTenantId(params: Record<string, any> | undefined, req: Request): string {
  if (params?.tenantId) return String(params.tenantId);
  const header = req.headers.get('x-tenant-id');
  if (header) return header;
  const url = new URL(req.url);
  const qp = url.searchParams.get('tenantId');
  if (qp) return qp;
  throw new TenantRequiredError();
}
