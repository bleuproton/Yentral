import { NextRequest } from 'next/server';
import { buildContext } from '@/server/tenant/buildContext';
import { jsonOk, jsonError, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { JobService } from '@/server/services/jobService';
import { JobEnqueueSchema } from '@/server/validators/job';

export async function GET(req: NextRequest) {
  try {
    const ctx = await buildContext(req);
    const service = new JobService();
    const status = req.nextUrl.searchParams.get('status') || undefined;
    const jobs = await service.list(ctx, { status });
    return jsonOk(jobs);
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await buildContext(req);
    requireWriteAccess(ctx, 'job.write');
    const body = JobEnqueueSchema.parse(await parseJson(req));
    const service = new JobService();
    const job = await service.enqueue(ctx, {
      type: body.type,
      payload: body.payload,
      dedupeKey: body.dedupeKey ?? null,
      correlationId: body.correlationId ?? null,
      nextRunAt: body.nextRunAt ?? null,
      priority: body.priority ?? 0,
    } as any);
    return jsonOk(job, 201);
  } catch (err) {
    return jsonError(err);
  }
}
