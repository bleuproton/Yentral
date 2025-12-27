// @ts-nocheck
import { PrismaClient } from '@prisma/client';

export class ProductRepository {
  constructor(private prisma: PrismaClient, private tenantId: string) {}

  listProducts(filters: { q?: string; status?: string } = {}) {
    const where: any = { tenantId: this.tenantId };
    if (filters.q) {
      where.OR = [
        { name: { contains: filters.q, mode: 'insensitive' } },
        { sku: { contains: filters.q, mode: 'insensitive' } },
      ];
    }
    if (filters.status) where.status = filters.status;
    return this.prisma.product.findMany({ where });
  }

  createProduct(data: any) {
    return this.prisma.product.create({
      data: { ...data, tenantId: this.tenantId },
    });
  }

  getProduct(productId: string) {
    return this.prisma.product.findUnique({
      where: { tenantId_id: { tenantId: this.tenantId, id: productId } },
    });
  }

  updateProduct(productId: string, data: any) {
    return this.prisma.product.update({
      where: { tenantId_id: { tenantId: this.tenantId, id: productId } },
      data,
    });
  }

  deleteProduct(productId: string) {
    return this.prisma.product.delete({
      where: { tenantId_id: { tenantId: this.tenantId, id: productId } },
    });
  }

  listVariants(productId: string) {
    return this.prisma.productVariant.findMany({
      where: { tenantId: this.tenantId, productId },
    });
  }

  createVariant(productId: string, data: any) {
    return this.prisma.productVariant.create({
      data: { ...data, tenantId: this.tenantId, productId },
    });
  }

  updateVariant(variantId: string, data: any) {
    return this.prisma.productVariant.update({
      where: { tenantId_id: { tenantId: this.tenantId, id: variantId } },
      data,
    });
  }

  deleteVariant(variantId: string) {
    return this.prisma.productVariant.delete({
      where: { tenantId_id: { tenantId: this.tenantId, id: variantId } },
    });
  }
}
