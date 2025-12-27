// @ts-nocheck
import { prisma } from '../db';
import { withContext } from '../tenant/als';
import { RequestContext } from '../tenant/context';
import { writeAuditEvent } from '../audit/auditService';

export class QuoteService {
  async createQuote(ctx: RequestContext, data: { customerId?: string; currency?: string; lines: any[] }) {
    const currency = data.currency || 'EUR';
    const subtotal = data.lines.reduce((sum, l) => sum + (l.totalCents ?? l.quantity * l.unitCents), 0);
    const tax = 0;
    const total = subtotal + tax;
    const quote = await withContext(ctx, () =>
      prisma.quote.create({
        data: {
          tenantId: ctx.tenantId,
          customerId: data.customerId ?? null,
          currency,
          subtotalCents: subtotal,
          taxCents: tax,
          totalCents: total,
          lines: {
            create: data.lines.map((l) => ({
              tenantId: ctx.tenantId,
              productId: l.productId ?? null,
              description: l.description ?? '',
              quantity: l.quantity,
              unitCents: l.unitCents,
              totalCents: l.totalCents ?? l.quantity * l.unitCents,
            })),
          },
        },
      })
    );
    await writeAuditEvent({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId ?? null,
      action: 'quote.create',
      resourceType: 'Quote',
      resourceId: quote.id,
      metadata: {},
    });
    return quote;
  }

  async updateQuote(ctx: RequestContext, id: string, data: any) {
    const quote = await withContext(ctx, () =>
      prisma.quote.update({
        where: { tenantId_id: { tenantId: ctx.tenantId, id } },
        data,
      })
    );
    await writeAuditEvent({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId ?? null,
      action: 'quote.update',
      resourceType: 'Quote',
      resourceId: quote.id,
    });
    return quote;
  }

  async listQuotes(ctx: RequestContext) {
    return withContext(ctx, () => prisma.quote.findMany({ where: { tenantId: ctx.tenantId }, orderBy: { createdAt: 'desc' } }));
  }

  getQuote(ctx: RequestContext, id: string) {
    return withContext(ctx, () =>
      prisma.quote.findUnique({ where: { tenantId_id: { tenantId: ctx.tenantId, id } }, include: { lines: true } })
    );
  }

  async sendQuote(ctx: RequestContext, id: string) {
    const quote = await withContext(ctx, () =>
      prisma.quote.update({ where: { tenantId_id: { tenantId: ctx.tenantId, id } }, data: { status: 'SENT' } })
    );
    await writeAuditEvent({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId ?? null,
      action: 'quote.send',
      resourceType: 'Quote',
      resourceId: quote.id,
    });
    return quote;
  }

  async convertToInvoice(ctx: RequestContext, id: string) {
    const quote = await this.getQuote(ctx, id);
    if (!quote) throw new Error('Quote not found');
    const invoice = await withContext(ctx, () =>
      prisma.invoice.create({
        data: {
          tenantId: ctx.tenantId,
          invoiceNumber: Date.now(),
          orderId: null,
          legalEntityId: prisma.legalEntity.findFirst({ where: { tenantId: ctx.tenantId } }).then((le) => le?.id ?? ''),
          status: 'DRAFT',
          currency: quote.currency,
          subtotalCents: quote.subtotalCents,
          taxCents: quote.taxCents,
          totalCents: quote.totalCents,
        },
      })
    );
    await prisma.invoiceLine.createMany({
      data: quote.lines.map((l: any) => ({
        tenantId: ctx.tenantId,
        invoiceId: invoice.id,
        description: l.description ?? '',
        qty: l.quantity,
        unitCents: l.unitCents,
        totalCents: l.totalCents,
      })),
    });
    await prisma.quote.update({ where: { tenantId_id: { tenantId: ctx.tenantId, id } }, data: { status: 'INVOICED' } });
    await writeAuditEvent({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId ?? null,
      action: 'quote.convert',
      resourceType: 'Quote',
      resourceId: quote.id,
      metadata: { invoiceId: invoice.id },
    });
    return invoice;
  }
}
