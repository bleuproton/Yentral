import { PrismaClient } from '@prisma/client';
import { ProductRepository } from '../repositories/productRepository';
import { ProductCreateSchema, ProductUpdateSchema, VariantCreateSchema, VariantUpdateSchema } from '../schemas/product';
import { writeAudit } from '../audit/audit';

export class ProductService {
  constructor(private prisma: PrismaClient, private tenantId: string, private actorUserId: string) {}

  repo() {
    return new ProductRepository(this.prisma, this.tenantId);
  }

  async listProducts(filters: { q?: string; status?: string }) {
    return this.repo().listProducts(filters);
  }

  async createProduct(input: unknown) {
    const data = ProductCreateSchema.parse(input);
    const product = await this.repo().createProduct(data);
    await writeAudit(this.tenantId, this.actorUserId, 'product.create', 'Product', product.id, { sku: product.sku });
    return product;
  }

  async getProduct(productId: string) {
    const product = await this.repo().getProduct(productId);
    return product;
  }

  async updateProduct(productId: string, input: unknown) {
    const data = ProductUpdateSchema.parse(input);
    const product = await this.repo().updateProduct(productId, data);
    await writeAudit(this.tenantId, this.actorUserId, 'product.update', 'Product', product.id, data);
    return product;
  }

  async deleteProduct(productId: string) {
    const product = await this.repo().deleteProduct(productId);
    await writeAudit(this.tenantId, this.actorUserId, 'product.delete', 'Product', product.id);
    return product;
  }

  async listVariants(productId: string) {
    return this.repo().listVariants(productId);
  }

  async createVariant(productId: string, input: unknown) {
    const data = VariantCreateSchema.parse(input);
    const variant = await this.repo().createVariant(productId, data);
    await writeAudit(this.tenantId, this.actorUserId, 'variant.create', 'ProductVariant', variant.id, { sku: variant.sku });
    return variant;
  }

  async updateVariant(variantId: string, input: unknown) {
    const data = VariantUpdateSchema.parse(input);
    const variant = await this.repo().updateVariant(variantId, data);
    await writeAudit(this.tenantId, this.actorUserId, 'variant.update', 'ProductVariant', variant.id, data);
    return variant;
  }

  async deleteVariant(variantId: string) {
    const variant = await this.repo().deleteVariant(variantId);
    await writeAudit(this.tenantId, this.actorUserId, 'variant.delete', 'ProductVariant', variant.id);
    return variant;
  }
}
