// @ts-nocheck
import { prisma } from '../db';
import { withContext } from '../tenant/als';
import { RequestContext } from '../tenant/context';
import { writeAuditEvent } from '../audit/auditService';

export class DocumentService {
  async renderQuote(ctx: RequestContext, quoteId: string, templateId?: string) {
    const render = await withContext(ctx, () =>
      prisma.documentRender.create({
        data: {
          tenantId: ctx.tenantId,
          templateId: templateId ?? '',
          refType: 'QUOTE',
          refId: quoteId,
          status: 'COMPLETED',
          outputUrl: `/files/quotes/${quoteId}.pdf`,
          payloadJson: {},
        },
      })
    );
    await writeAuditEvent({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId ?? null,
      action: 'document.render',
      resourceType: 'Quote',
      resourceId: quoteId,
      metadata: { renderId: render.id },
    });
    return render;
  }

  async renderInvoice(ctx: RequestContext, invoiceId: string, templateId?: string) {
    const render = await withContext(ctx, () =>
      prisma.documentRender.create({
        data: {
          tenantId: ctx.tenantId,
          templateId: templateId ?? '',
          refType: 'INVOICE',
          refId: invoiceId,
          status: 'COMPLETED',
          outputUrl: `/files/invoices/${invoiceId}.pdf`,
          payloadJson: {},
        },
      })
    );
    await writeAuditEvent({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId ?? null,
      action: 'document.render',
      resourceType: 'Invoice',
      resourceId: invoiceId,
      metadata: { renderId: render.id },
    });
    return render;
  }
}
