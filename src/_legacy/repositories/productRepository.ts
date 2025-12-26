import { prisma } from "@/lib/prisma";
import type { Prisma, Product, ProductVariant } from "@prisma/client";

type CreateProductInput = Omit<Prisma.ProductUncheckedCreateInput, "tenantId"> & { tenantId: string };
type UpdateProductInput = Prisma.ProductUncheckedUpdateInput;
type CreateVariantInput = Omit<Prisma.ProductVariantUncheckedCreateInput, "tenantId" | "productId"> & {
  tenantId: string;
  productId: string;
};

export class ProductRepository {
  async getById(tenantId: string, id: string): Promise<Product | null> {
    return prisma.product.findFirst({ where: { tenantId, id } });
  }

  async list(tenantId: string, opts?: { status?: string; take?: number; skip?: number }) {
    return prisma.product.findMany({
      where: { tenantId, status: opts?.status },
      orderBy: { createdAt: "desc" },
      take: opts?.take,
      skip: opts?.skip
    });
  }

  async create(data: CreateProductInput) {
    return prisma.product.create({ data });
  }

  async update(tenantId: string, id: string, data: UpdateProductInput) {
    return prisma.product.update({ where: { id }, data, select: { id: true } });
  }

  async delete(tenantId: string, id: string) {
    return prisma.product.delete({ where: { id } });
  }

  async listVariants(tenantId: string, productId: string): Promise<ProductVariant[]> {
    return prisma.productVariant.findMany({ where: { tenantId, productId } });
  }

  async createVariant(data: CreateVariantInput) {
    return prisma.productVariant.create({ data });
  }
}
