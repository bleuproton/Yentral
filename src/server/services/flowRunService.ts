// @ts-nocheck
import { prisma } from '../db';
import { withContext } from '../tenant/als';
import { RequestContext } from '../tenant/context';
import { FlowRunStatus } from '@prisma/client';

export class FlowRunService {
  async startRun(ctx: RequestContext, flowId: string, input: any) {
    return withContext(ctx, async () => {
      const version = await prisma.flowVersion.findFirst({
        where: { tenantId: ctx.tenantId, flowId, published: true },
        orderBy: { version: 'desc' },
      });
      if (!version) throw new Error('No published version');
      return prisma.flowRun.create({
        data: {
          tenantId: ctx.tenantId,
          flowId,
          flowVersionId: version.id,
          status: FlowRunStatus.PENDING,
          input,
        },
      });
    });
  }

  getRun(ctx: RequestContext, runId: string) {
    return withContext(ctx, () =>
      prisma.flowRun.findUnique({
        where: { tenantId_id: { tenantId: ctx.tenantId, id: runId } },
        include: { logs: true },
      })
    );
  }

  listRuns(ctx: RequestContext, filters: any = {}) {
    const where: any = { tenantId: ctx.tenantId };
    if (filters.flowId) where.flowId = filters.flowId;
    if (filters.status) where.status = filters.status;
    return withContext(ctx, () =>
      prisma.flowRun.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.take,
      })
    );
  }
}
