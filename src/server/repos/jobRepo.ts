import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import { withContext } from '../tenant/als';
import { RequestContext } from '../tenant/context';

export class JobRepo {
  async enqueueJob(ctx: RequestContext, data: Prisma.JobUncheckedCreateInput) {
    return withContext(ctx, async () => {
      if (data.dedupeKey) {
        const existing = await prisma.job.findFirst({
          where: { tenantId: ctx.tenantId, dedupeKey: data.dedupeKey },
        });
        if (existing) return existing;
      }
      return prisma.job.create({
        data: { ...data, tenantId: ctx.tenantId },
      });
    });
  }

  async listJobs(ctx: RequestContext, filters: { status?: string } = {}) {
    return withContext(ctx, () =>
      prisma.job.findMany({
        where: { tenantId: ctx.tenantId, status: filters.status },
        orderBy: { createdAt: 'desc' },
      })
    );
  }
}
