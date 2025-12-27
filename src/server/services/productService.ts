// @ts-nocheck
import { RequestContext } from '../tenant/context';
import { ProductRepo } from '../repos/productRepo';
import { VariantRepo } from '../repos/variantRepo';
import { withContext } from '../tenant/als';
import { prisma } from '../db';

export class ProductService {
  private products = new ProductRepo();
  private variants = new VariantRepo();

  async createProductWithDefaultVariant(ctx: RequestContext, productData: any, variantSku?: string) {
    const product = await this.products.createProduct(ctx, productData);
    if (variantSku) {
      await this.variants.createVariant(ctx, {
        productId: product.id,
        sku: variantSku,
      } as any);
    }
    return product;
  }

  async ensureProductVariant(ctx: RequestContext, productId: string) {
    const existing = await this.variants.listVariantsByProduct(ctx, productId);
    if (existing.length > 0) return existing[0];
    return this.variants.createVariant(ctx, {
      productId,
      sku: `VAR-${Date.now()}`,
    } as any);
  }

  async list(ctx: RequestContext, filters: any) {
    return this.products.listProducts(ctx, filters);
  }

  async update(ctx: RequestContext, id: string, data: any) {
    return this.products.updateProduct(ctx, id, data);
  }

  async get(ctx: RequestContext, id: string) {
    return this.products.getProduct(ctx, id);
  }
}
