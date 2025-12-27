// @ts-nocheck
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { jsonOk, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { QuoteService } from '@/server/services/quoteService';

export const GET = tenantRoute(async ({ ctx, params }) => {
  const svc = new QuoteService();
  const quote = await svc.getQuote(ctx, params.quoteId);
  return jsonOk(quote);
});

export const PATCH = tenantRoute(async ({ req, ctx, params }) => {
  requireWriteAccess(ctx, 'quote.write');
  const body = await parseJson(req);
  const svc = new QuoteService();
  const updated = await svc.updateQuote(ctx, params.quoteId, body);
  return jsonOk(updated);
});
