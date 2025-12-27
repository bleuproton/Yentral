import { getActorUserId } from '../auth/getActor';
import { resolveTenantId } from '../tenant/resolveTenant';
import { requireTenantAccess } from '../tenant/requireTenantAccess';
import { tenantDb } from '../db/tenantDb';
import { jsonError } from './response';
import { AppError } from './errors';

type HandlerCtx = {
  tenantId: string;
  actorUserId: string;
  role: any;
  db: ReturnType<typeof tenantDb>;
  req: Request;
  params: Record<string, any>;
};

export async function withApiContext(
  req: Request,
  params: Record<string, any>,
  handler: (ctx: HandlerCtx) => Promise<Response>
): Promise<Response> {
  try {
    const tenantId = resolveTenantId(params, req);
    const actorUserId = await getActorUserId();
    const role = await requireTenantAccess(tenantDb(tenantId), actorUserId, tenantId);
    const db = tenantDb(tenantId);
    return await handler({ tenantId, actorUserId, role, db, req, params });
  } catch (err: any) {
    if (err instanceof AppError) {
      return jsonError({ code: err.code, message: err.message }, { status: err.statusCode });
    }
    return jsonError({ code: 'INTERNAL_ERROR', message: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
