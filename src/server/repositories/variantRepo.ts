// @ts-nocheck
import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";

export class VariantRepo {
  async getById(tenantId: string, id: string) {
    return prisma.productVariant.findFirst({ where: { id, tenantId } });
  }

  async list(tenantId: string, productId?: string) {
    return prisma.productVariant.findMany({
      where: { tenantId, productId },
      orderBy: { createdAt: "desc" }
    });
  }

  async create(tenantId: string, data: { productId: string; sku: string; ean?: string; attributes?: Prisma.JsonValue }) {
    return prisma.productVariant.create({
      data: {
        tenantId,
        productId: data.productId,
        sku: data.sku,
        ean: data.ean,
        attributes: data.attributes
      }
    });
  }
}
