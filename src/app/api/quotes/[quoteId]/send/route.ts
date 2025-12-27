// @ts-nocheck
import { tenantRoute } from '@/app/api/_utils/tenantRoute';
import { jsonOk, requireWriteAccess } from '@/app/api/_utils';
import { QuoteService } from '@/server/services/quoteService';

export const POST = tenantRoute(async ({ ctx, params }) => {
  requireWriteAccess(ctx, 'quote.write');
  const svc = new QuoteService();
  const sent = await svc.sendQuote(ctx, params.quoteId);
  return jsonOk(sent);
});
