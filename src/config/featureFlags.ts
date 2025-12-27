const tenantFeatures: Record<string, Record<string, boolean>> = {};

export function isFeatureEnabled(tenantId: string, feature: string): boolean {
  const tenant = tenantFeatures[tenantId];
  if (tenant && feature in tenant) return !!tenant[feature];
  // default on
  return true;
}
