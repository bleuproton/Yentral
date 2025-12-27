// @ts-nocheck
import { NextRequest } from 'next/server';
import { buildContext } from '@/server/tenant/buildContext';
import { withContext } from '@/server/tenant/als';
import { jsonError } from '../_utils';
import { RequestContext } from '@/server/tenant/context';

type TenantHandler = (args: { req: NextRequest; ctx: RequestContext; params?: any }) => Promise<Response>;

export function tenantRoute(handler: TenantHandler) {
  return async (req: NextRequest, routeContext?: { params?: any }) => {
    try {
      const ctx = await buildContext(req);
      return await withContext(ctx, () => handler({ req, ctx, params: routeContext?.params }));
    } catch (err) {
      return jsonError(err);
    }
  };
}
