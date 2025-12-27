// @ts-nocheck
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class MailboxService {
  createMailbox(tenantId: string, data: Omit<Prisma.MailboxUncheckedCreateInput, "tenantId">) {
    return prisma.mailbox.create({ data: { ...data, tenantId } });
  }

  listMailboxes(tenantId: string) {
    return prisma.mailbox.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } });
  }

  getMailbox(tenantId: string, id: string) {
    return prisma.mailbox.findFirst({ where: { tenantId, id } });
  }

  updateMailbox(tenantId: string, id: string, data: Prisma.MailboxUpdateInput) {
    return prisma.mailbox.updateMany({ where: { tenantId, id }, data });
  }
}
