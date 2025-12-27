import { PrismaClient } from '@prisma/client';

export class TicketRepository {
  constructor(private prisma: PrismaClient, private tenantId: string) {}

  listTickets(filters: { status?: string } = {}) {
    const where: any = { tenantId: this.tenantId };
    if (filters.status) where.status = filters.status;
    return this.prisma.ticket.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  createTicket(actorUserId: string, data: any) {
    return this.prisma.ticket.create({
      data: {
        ...data,
        tenantId: this.tenantId,
        authorId: actorUserId,
      },
    });
  }

  getTicket(ticketId: string) {
    return this.prisma.ticket.findUnique({
      where: { tenantId_id: { tenantId: this.tenantId, id: ticketId } },
    });
  }

  updateTicket(ticketId: string, data: any) {
    return this.prisma.ticket.update({
      where: { tenantId_id: { tenantId: this.tenantId, id: ticketId } },
      data,
    });
  }
}
