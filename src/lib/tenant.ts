import { cookies } from 'next/headers';

const TENANT_COOKIE = 'tenantId';

export function getActiveTenantId(): string | null {
  const c = cookies().get(TENANT_COOKIE)?.value;
  return c ?? null;
}

export function setActiveTenantId(tenantId: string) {
  if (!tenantId) return;
  const store = cookies();
  store.set(TENANT_COOKIE, tenantId, { path: '/', httpOnly: false });
}
