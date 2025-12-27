// @ts-nocheck
import { PrismaClient } from '@prisma/client';

export class MediaRepository {
  constructor(private prisma: PrismaClient, private tenantId: string) {}

  createAsset(data: any) {
    return this.prisma.mediaAsset.create({ data: { ...data, tenantId: this.tenantId } });
  }

  listProductMedia(productId: string) {
    return this.prisma.productMedia.findMany({
      where: { tenantId: this.tenantId, productId },
      include: { asset: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  attachProductMedia(productId: string, assetId: string, altText?: string, sortOrder = 0) {
    return this.prisma.productMedia.upsert({
      where: { tenantId_productId_assetId: { tenantId: this.tenantId, productId, assetId } },
      update: { altText, sortOrder },
      create: { tenantId: this.tenantId, productId, assetId, altText, sortOrder },
    });
  }

  detachProductMedia(productId: string, assetId: string) {
    return this.prisma.productMedia.delete({
      where: { tenantId_productId_assetId: { tenantId: this.tenantId, productId, assetId } },
    });
  }
}
