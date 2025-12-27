import { getRequestContext, requireTenant } from '../context/requestContext';
import { requireMembership } from '../auth/requireMembership';
import { jsonError } from './response';
import { toHttpResponse, AppError } from './errors';

type Handler<T = any> = (ctx: any) => Promise<Response>;

export function withApi(handler: Handler) {
  return async (req: Request, params?: any) => {
    try {
      const ctx = await getRequestContext(req);
      requireTenant(ctx);
      if (ctx.actorUserId) {
        await requireMembership(ctx.tenantId, ctx.actorUserId);
      }
      return await handler({ ...ctx, req, params });
    } catch (err: any) {
      const { status, body } = toHttpResponse(err);
      return jsonError(body.error, { status });
    }
  };
}
