// @ts-nocheck
import { VariantRepo } from '../repos/variantRepo';
import { RequestContext } from '../tenant/context';

export class VariantService {
  private variants = new VariantRepo();

  async create(ctx: RequestContext, data: any) {
    return this.variants.createVariant(ctx, data);
  }

  async listByProduct(ctx: RequestContext, productId: string) {
    return this.variants.listVariantsByProduct(ctx, productId);
  }

  async update(ctx: RequestContext, id: string, data: any) {
    return this.variants.updateVariant(ctx, id, data);
  }

  async get(ctx: RequestContext, id: string) {
    return this.variants.getVariant(ctx, id);
  }
}
