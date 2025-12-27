// @ts-nocheck
import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import { withContext } from '../tenant/als';
import { RequestContext } from '../tenant/context';

export class TicketRepo {
  async createTicket(ctx: RequestContext, data: Prisma.TicketUncheckedCreateInput) {
    return withContext(ctx, () =>
      prisma.ticket.create({
        data: {
          ...data,
          tenantId: ctx.tenantId,
        },
      })
    );
  }

  async listTickets(ctx: RequestContext, filters: { status?: string } = {}) {
    return withContext(ctx, () =>
      prisma.ticket.findMany({
        where: { tenantId: ctx.tenantId, status: filters.status },
        orderBy: { createdAt: 'desc' },
      })
    );
  }

  async updateTicketStatus(ctx: RequestContext, id: string, status: string) {
    return withContext(ctx, () =>
      prisma.ticket.update({
        where: { tenantId_id: { tenantId: ctx.tenantId, id } },
        data: { status },
      })
    );
  }

  async getTicket(ctx: RequestContext, id: string) {
    return withContext(ctx, () =>
      prisma.ticket.findUnique({
        where: { tenantId_id: { tenantId: ctx.tenantId, id } },
      })
    );
  }
}
