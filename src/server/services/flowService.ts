// @ts-nocheck
import { prisma } from '../db';
import { withContext } from '../tenant/als';
import { RequestContext } from '../tenant/context';

export class FlowService {
  async createFlow(ctx: RequestContext, data: { name: string; description?: string; slug?: string }) {
    return withContext(ctx, () =>
      prisma.flow.create({
        data: { tenantId: ctx.tenantId, name: data.name, description: data.description ?? null, slug: data.slug ?? null },
      })
    );
  }

  async updateFlow(ctx: RequestContext, id: string, data: any) {
    return withContext(ctx, () =>
      prisma.flow.update({
        where: { tenantId_id: { tenantId: ctx.tenantId, id } },
        data,
      })
    );
  }

  async publishVersion(ctx: RequestContext, flowId: string, definition: any) {
    return withContext(ctx, async () => {
      const latest = await prisma.flowVersion.findFirst({
        where: { tenantId: ctx.tenantId, flowId },
        orderBy: { version: 'desc' },
      });
      const version = (latest?.version ?? 0) + 1;
      await prisma.flowVersion.updateMany({
        where: { tenantId: ctx.tenantId, flowId },
        data: { published: false },
      });
      return prisma.flowVersion.create({
        data: {
          tenantId: ctx.tenantId,
          flowId,
          version,
          definition,
          published: true,
        },
      });
    });
  }

  listFlows(ctx: RequestContext) {
    return withContext(ctx, () => prisma.flow.findMany({ where: { tenantId: ctx.tenantId }, orderBy: { createdAt: 'desc' } }));
  }

  getFlow(ctx: RequestContext, id: string) {
    return withContext(ctx, () =>
      prisma.flow.findUnique({
        where: { tenantId_id: { tenantId: ctx.tenantId, id } },
        include: { versions: true },
      })
    );
  }

  listVersions(ctx: RequestContext, flowId: string) {
    return withContext(ctx, () =>
      prisma.flowVersion.findMany({
        where: { tenantId: ctx.tenantId, flowId },
        orderBy: { version: 'desc' },
      })
    );
  }
}
