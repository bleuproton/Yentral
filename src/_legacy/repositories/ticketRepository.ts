// @ts-nocheck
import { prisma } from "@/lib/prisma";
import type { Prisma, Ticket, TicketComment } from "@prisma/client";

type CreateTicketInput = Omit<Prisma.TicketUncheckedCreateInput, "tenantId"> & { tenantId: string };
type UpdateTicketInput = Prisma.TicketUncheckedUpdateInput;
type CreateCommentInput = Omit<Prisma.TicketCommentUncheckedCreateInput, "tenantId"> & { tenantId: string };

export class TicketRepository {
  async getById(tenantId: string, id: string): Promise<Ticket | null> {
    return prisma.ticket.findFirst({ where: { tenantId, id } });
  }

  async list(tenantId: string, opts?: { status?: string; assigneeId?: string; take?: number; skip?: number }) {
    return prisma.ticket.findMany({
      where: { tenantId, status: opts?.status as any, assigneeId: opts?.assigneeId },
      orderBy: { createdAt: "desc" },
      take: opts?.take,
      skip: opts?.skip
    });
  }

  async create(data: CreateTicketInput) {
    return prisma.ticket.create({ data });
  }

  async update(id: string, data: UpdateTicketInput) {
    return prisma.ticket.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.ticket.delete({ where: { id } });
  }

  async listComments(tenantId: string, ticketId: string): Promise<TicketComment[]> {
    return prisma.ticketComment.findMany({ where: { tenantId, ticketId }, orderBy: { createdAt: "asc" } });
  }

  async addComment(data: CreateCommentInput): Promise<TicketComment> {
    return prisma.ticketComment.create({ data });
  }
}
