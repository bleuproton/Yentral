import { withApi } from '@/server/http/withApi';
import { JobService } from '@/server/services/jobService';
import { tenantDb } from '@/server/db/tenantDb';
import { jsonOk, created } from '@/server/http/response';
import { parseJson } from '@/server/validation/zod';
import { JobEnqueueSchema } from '@/server/schemas/job';

export const GET = withApi(async (ctx) => {
  const service = new JobService(tenantDb(ctx.tenantId), ctx.tenantId, ctx.actorUserId || '');
  const list = await service.list({});
  return jsonOk(list);
});

export const POST = withApi(async (ctx) => {
  const body = await parseJson(ctx.req, JobEnqueueSchema);
  const service = new JobService(tenantDb(ctx.tenantId), ctx.tenantId, ctx.actorUserId || '');
  const job = await service.enqueue(body);
  return created(job);
});
