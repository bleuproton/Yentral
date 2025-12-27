// @ts-nocheck
import { RequestContext } from '../tenant/context';
import { MappingRepo } from '../repos/mappingRepo';

export class ChannelCatalogService {
  private repo = new MappingRepo();

  linkProduct(ctx: RequestContext, connectionId: string, externalId: string, productId: string, raw?: any) {
    return this.repo.linkChannelProduct(ctx, connectionId, externalId, productId, raw);
  }

  linkVariant(
    ctx: RequestContext,
    connectionId: string,
    externalId: string,
    variantId: string,
    asin?: string,
    externalSku?: string,
    raw?: any
  ) {
    return this.repo.linkChannelVariant(ctx, connectionId, externalId, variantId, asin, externalSku, raw);
  }
}
