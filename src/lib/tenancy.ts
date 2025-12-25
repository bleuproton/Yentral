export function assertTenant<T extends { tenantId: string }>(record: T | null, tenantId: string): T {
  if (!record || record.tenantId !== tenantId) {
    throw new Error("TENANT_MISMATCH");
  }
  return record;
}
