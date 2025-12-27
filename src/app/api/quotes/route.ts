// @ts-nocheck
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { jsonOk, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { QuoteService } from '@/server/services/quoteService';

export const GET = tenantRoute(async ({ ctx }) => {
  const svc = new QuoteService();
  const quotes = await svc.listQuotes(ctx);
  return jsonOk(quotes);
});

export const POST = tenantRoute(async ({ req, ctx }) => {
  requireWriteAccess(ctx, 'quote.write');
  const body = await parseJson(req);
  const svc = new QuoteService();
  const quote = await svc.createQuote(ctx, body);
  return jsonOk(quote, 201);
});
