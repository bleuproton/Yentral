import { cookies } from 'next/headers';

const TENANT_COOKIE = 'tenantId';

export function getActiveTenantId(): string | null {
  const c = cookies().get(TENANT_COOKIE)?.value;
  return c ?? null;
}
