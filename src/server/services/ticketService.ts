import { RequestContext } from '../tenant/context';
import { TicketRepo } from '../repos/ticketRepo';
import { prisma } from '../db';
import { withContext } from '../tenant/als';

export class TicketService {
  private repo = new TicketRepo();

  async createTicketAndLinkThread(ctx: RequestContext, data: any) {
    if (data.emailThreadId) {
      const thread = await withContext(ctx, () =>
        prisma.emailThread.findUnique({
          where: { tenantId_id: { tenantId: ctx.tenantId, id: data.emailThreadId } },
        })
      );
      if (!thread) {
        throw new Error('Email thread not found for tenant');
      }
    }
    return this.repo.createTicket(ctx, data);
  }

  listTickets(ctx: RequestContext, filters: any) {
    return this.repo.listTickets(ctx, filters);
  }
}
