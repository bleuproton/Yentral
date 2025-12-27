// @ts-nocheck
import { PrismaClient } from '@prisma/client';

export class IntegrationRepository {
  constructor(private prisma: PrismaClient, private tenantId: string) {}

  listConnections() {
    return this.prisma.integrationConnection.findMany({
      where: { tenantId: this.tenantId },
    });
  }

  createConnection(data: any) {
    return this.prisma.integrationConnection.create({
      data: { ...data, tenantId: this.tenantId },
    });
  }

  getConnection(connectionId: string) {
    return this.prisma.integrationConnection.findUnique({
      where: { tenantId_id: { tenantId: this.tenantId, id: connectionId } },
    });
  }

  updateConnection(connectionId: string, data: any) {
    return this.prisma.integrationConnection.update({
      where: { tenantId_id: { tenantId: this.tenantId, id: connectionId } },
      data,
    });
  }

  upsertWarehouseMapping(connectionId: string, externalLocationId: string, warehouseId: string) {
    return this.prisma.warehouseMapping.upsert({
      where: {
        tenantId_connectionId_externalLocationId: {
          tenantId: this.tenantId,
          connectionId,
          externalLocationId,
        },
      },
      update: { warehouseId },
      create: { tenantId: this.tenantId, connectionId, externalLocationId, warehouseId },
    });
  }

  resolveWarehouse(connectionId: string, externalLocationId: string) {
    return this.prisma.warehouseMapping.findUnique({
      where: {
        tenantId_connectionId_externalLocationId: {
          tenantId: this.tenantId,
          connectionId,
          externalLocationId,
        },
      },
    });
  }

  linkChannelProduct(connectionId: string, externalId: string, productId: string, raw?: any) {
    return this.prisma.channelProduct.upsert({
      where: { tenantId_connectionId_externalId: { tenantId: this.tenantId, connectionId, externalId } },
      update: { productId, raw },
      create: { tenantId: this.tenantId, connectionId, externalId, productId, raw },
    });
  }

  linkChannelVariant(
    connectionId: string,
    externalId: string,
    variantId: string,
    asin?: string,
    externalSku?: string,
    raw?: any
  ) {
    return this.prisma.channelVariant.upsert({
      where: { tenantId_connectionId_externalId: { tenantId: this.tenantId, connectionId, externalId } },
      update: { variantId, asin, externalSku, raw },
      create: { tenantId: this.tenantId, connectionId, externalId, variantId, asin, externalSku, raw },
    });
  }

  linkChannelOrder(connectionId: string, externalOrderId: string, orderId: string, raw?: any) {
    return this.prisma.channelOrder.upsert({
      where: { tenantId_connectionId_externalOrderId: { tenantId: this.tenantId, connectionId, externalOrderId } },
      update: { orderId, raw },
      create: { tenantId: this.tenantId, connectionId, externalOrderId, orderId, raw },
    });
  }
}
