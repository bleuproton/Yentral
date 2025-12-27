// @ts-nocheck
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class VariantService {
  async list(tenantId: string, productId?: string) {
    return prisma.productVariant.findMany({
      where: { tenantId, productId },
      orderBy: { createdAt: "desc" }
    });
  }

  async create(tenantId: string, input: { productId: string; sku: string; ean?: string; attributes?: Prisma.JsonValue }) {
    return prisma.productVariant.create({
      data: {
        tenantId,
        productId: input.productId,
        sku: input.sku,
        ean: input.ean,
        attributes: input.attributes
      }
    });
  }

  async update(tenantId: string, id: string, data: Prisma.ProductVariantUpdateInput) {
    return prisma.productVariant.update({
      where: { id },
      data
    });
  }

  async delete(tenantId: string, id: string) {
    return prisma.productVariant.delete({ where: { id } });
  }
}
