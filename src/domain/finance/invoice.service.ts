import { InvoiceStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class InvoiceService {
  private async nextInvoiceNumber(tenantId: string, tx: Prisma.TransactionClient) {
    const result = await tx.invoice.aggregate({
      where: { tenantId },
      _max: { invoiceNumber: true }
    });
    return (result._max.invoiceNumber ?? 0) + 1;
  }

  async createFromOrder(tenantId: string, orderId: string, opts?: { legalEntityId?: string; taxProfileId?: string | null }) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { tenantId, id: orderId },
        include: { lines: true }
      });
      if (!order) throw new Error("ORDER_NOT_FOUND");

      const invoiceNumber = await this.nextInvoiceNumber(tenantId, tx);
      const subtotal = order.lines.reduce((sum, l) => sum + l.totalCents, 0);
      const taxCents = 0;
      const totalCents = subtotal + taxCents;

      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          orderId,
          legalEntityId: opts?.legalEntityId ?? "",
          taxProfileId: opts?.taxProfileId ?? null,
          invoiceNumber,
          status: InvoiceStatus.DRAFT,
          currency: order.currency,
          subtotalCents: subtotal,
          taxCents,
          totalCents
        }
      });

      for (const line of order.lines) {
        await tx.invoiceLine.create({
          data: {
            tenantId,
            invoiceId: invoice.id,
            orderLineId: line.id,
            variantId: line.variantId ?? null,
            description: `Order line ${line.id}`,
            qty: line.quantity,
            unitCents: line.unitCents,
            totalCents: line.totalCents
          }
        });
      }

      await tx.auditEvent.create({
        data: {
          tenantId,
          action: "INVOICE_CREATED",
          resourceType: "Invoice",
          resourceId: invoice.id
        }
      });

      return tx.invoice.findFirst({ where: { tenantId, id: invoice.id }, include: { lines: true } });
    });
  }

  getInvoice(tenantId: string, invoiceId: string) {
    return prisma.invoice.findFirst({ where: { tenantId, id: invoiceId }, include: { lines: true } });
  }

  listInvoices(tenantId: string, filters?: { orderId?: string; status?: InvoiceStatus }) {
    return prisma.invoice.findMany({
      where: { tenantId, orderId: filters?.orderId, status: filters?.status },
      orderBy: { createdAt: "desc" },
      include: { lines: true }
    });
  }

  async issueInvoice(tenantId: string, invoiceId: string) {
    await prisma.invoice.updateMany({
      where: { tenantId, id: invoiceId },
      data: { status: InvoiceStatus.ISSUED, issuedAt: new Date() }
    });
    await prisma.auditEvent.create({
      data: { tenantId, action: "INVOICE_ISSUED", resourceType: "Invoice", resourceId: invoiceId }
    });
    return this.getInvoice(tenantId, invoiceId);
  }

  async markPaid(tenantId: string, invoiceId: string, paidAt?: Date | null) {
    await prisma.invoice.updateMany({
      where: { tenantId, id: invoiceId },
      data: { status: InvoiceStatus.PAID, paidAt: paidAt ?? new Date() }
    });
    await prisma.auditEvent.create({
      data: { tenantId, action: "INVOICE_PAID", resourceType: "Invoice", resourceId: invoiceId }
    });
    return this.getInvoice(tenantId, invoiceId);
  }
}
