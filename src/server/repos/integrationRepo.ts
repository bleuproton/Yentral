// @ts-nocheck
import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import { withContext } from '../tenant/als';
import { RequestContext } from '../tenant/context';

export class IntegrationRepo {
  async createConnection(ctx: RequestContext, data: Prisma.IntegrationConnectionUncheckedCreateInput) {
    return withContext(ctx, () =>
      prisma.integrationConnection.create({
        data: { ...data, tenantId: ctx.tenantId },
      })
    );
  }

  async listConnections(ctx: RequestContext) {
    return withContext(ctx, () =>
      prisma.integrationConnection.findMany({
        where: { tenantId: ctx.tenantId },
        orderBy: { createdAt: 'desc' },
      })
    );
  }

  async getConnection(ctx: RequestContext, id: string) {
    return withContext(ctx, () =>
      prisma.integrationConnection.findUnique({
        where: { tenantId_id: { tenantId: ctx.tenantId, id } },
      })
    );
  }

  async updateConnection(ctx: RequestContext, id: string, data: Prisma.IntegrationConnectionUpdateInput) {
    return withContext(ctx, () =>
      prisma.integrationConnection.update({
        where: { tenantId_id: { tenantId: ctx.tenantId, id } },
        data,
      })
    );
  }

  async updateConnectionSyncState(ctx: RequestContext, id: string, data: { lastSyncAt?: Date | null; lastError?: string | null }) {
    return withContext(ctx, () =>
      prisma.integrationConnection.update({
        where: { tenantId_id: { tenantId: ctx.tenantId, id } },
        data: { lastSyncAt: data.lastSyncAt ?? undefined, lastError: data.lastError ?? undefined },
      })
    );
  }
}
