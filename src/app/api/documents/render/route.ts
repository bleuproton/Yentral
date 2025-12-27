// @ts-nocheck
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { jsonOk, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { DocumentService } from '@/server/services/documentService';

export const POST = tenantRoute(async ({ req, ctx }) => {
  requireWriteAccess(ctx, 'document.write');
  const body = await parseJson(req);
  const svc = new DocumentService();
  let render;
  if (body.refType === 'QUOTE') {
    render = await svc.renderQuote(ctx, body.refId, body.templateId);
  } else {
    render = await svc.renderInvoice(ctx, body.refId, body.templateId);
  }
  return jsonOk(render, 201);
});
