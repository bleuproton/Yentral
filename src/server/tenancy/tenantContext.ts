import { RequestContext } from '../tenant/context';
import { als } from '../tenant/als';

export type TenantContext = RequestContext & { tenantSlug?: string };

export function runWithTenantContext<T>(ctx: TenantContext, fn: () => Promise<T>): Promise<T> {
  return als.run(ctx, fn);
}

export function getTenantContext(): TenantContext | null {
  return (als.getStore() as TenantContext) ?? null;
}

export function requireTenantContext(): TenantContext {
  const ctx = getTenantContext();
  if (!ctx || !ctx.tenantId) {
    throw new Error('Missing tenant context');
  }
  return ctx;
}
