import { ProductStatus } from "@prisma/client";
import { ProductRepository } from "@/_legacy/repositories/productRepository";

export class ProductService {
  constructor(private repo = new ProductRepository()) {}

  async createProduct(tenantId: string, input: { sku: string; name: string; description?: string }) {
    if (!input.sku) throw new Error("SKU is required");
    const existing = await this.repo.list(tenantId, { status: undefined, take: 1, skip: 0 });
    const duplicate = existing.find((p) => p.sku === input.sku);
    if (duplicate) throw new Error("SKU already exists");

    const product = await this.repo.create({
      tenantId,
      sku: input.sku,
      name: input.name,
      description: input.description,
      status: ProductStatus.ACTIVE
    });

    return { product, events: [{ type: "product.created", tenantId, productId: product.id }] };
  }

  async updateProduct(tenantId: string, productId: string, input: { name?: string; description?: string; status?: ProductStatus }) {
    const existing = await this.repo.getById(tenantId, productId);
    if (!existing) throw new Error("Product not found");
    await this.repo.update(tenantId, productId, {
      name: input.name ?? existing.name,
      description: input.description ?? existing.description,
      status: input.status ?? existing.status
    });
    return { events: [{ type: "product.updated", tenantId, productId }] };
  }

  async addVariant(tenantId: string, productId: string, input: { sku: string; name: string; priceCents: number; currency: string }) {
    const product = await this.repo.getById(tenantId, productId);
    if (!product) throw new Error("Product not found");
    const variant = await this.repo.createVariant({
      tenantId,
      productId,
      sku: input.sku,
      name: input.name,
      priceCents: input.priceCents,
      currency: input.currency,
      status: ProductStatus.ACTIVE
    });
    return { variant, events: [{ type: "variant.created", tenantId, productId, variantId: variant.id }] };
  }
}
