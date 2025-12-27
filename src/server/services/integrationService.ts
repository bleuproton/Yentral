// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import {
  IntegrationCreateSchema,
  IntegrationUpdateSchema,
  WarehouseMappingUpsertSchema,
  ChannelProductLinkSchema,
  ChannelVariantLinkSchema,
  ChannelOrderLinkSchema,
} from '../schemas/integration';
import { IntegrationRepository } from '../repositories/integrationRepository';
import { writeAudit } from '../audit/audit';

export class IntegrationService {
  constructor(private prisma: PrismaClient, private tenantId: string, private actorUserId: string) {}

  repo() {
    return new IntegrationRepository(this.prisma, this.tenantId);
  }

  listConnections() {
    return this.repo().listConnections();
  }

  async createConnection(input: unknown) {
    const data = IntegrationCreateSchema.parse(input);
    const conn = await this.repo().createConnection(data);
    await writeAudit(this.tenantId, this.actorUserId, 'integration.create', 'IntegrationConnection', conn.id, data);
    return conn;
  }

  getConnection(id: string) {
    return this.repo().getConnection(id);
  }

  async updateConnection(id: string, input: unknown) {
    const data = IntegrationUpdateSchema.parse(input);
    const conn = await this.repo().updateConnection(id, data);
    await writeAudit(this.tenantId, this.actorUserId, 'integration.update', 'IntegrationConnection', conn.id, data);
    return conn;
  }

  async upsertWarehouseMapping(connectionId: string, input: unknown) {
    const data = WarehouseMappingUpsertSchema.parse(input);
    const mapping = await this.repo().upsertWarehouseMapping(connectionId, data.externalLocationId, data.warehouseId);
    await writeAudit(this.tenantId, this.actorUserId, 'integration.warehouseMapping', 'WarehouseMapping', mapping.id, data);
    return mapping;
  }

  resolveWarehouse(connectionId: string, externalLocationId: string) {
    return this.repo().resolveWarehouse(connectionId, externalLocationId);
  }

  async linkChannelProduct(connectionId: string, input: unknown) {
    const data = ChannelProductLinkSchema.parse(input);
    const res = await this.repo().linkChannelProduct(connectionId, data.externalId, data.productId, data.raw);
    await writeAudit(this.tenantId, this.actorUserId, 'integration.linkProduct', 'ChannelProduct', res.id, data);
    return res;
  }

  async linkChannelVariant(connectionId: string, input: unknown) {
    const data = ChannelVariantLinkSchema.parse(input);
    const res = await this.repo().linkChannelVariant(
      connectionId,
      data.externalId,
      data.variantId,
      data.asin,
      data.externalSku,
      data.raw
    );
    await writeAudit(this.tenantId, this.actorUserId, 'integration.linkVariant', 'ChannelVariant', res.id, data);
    return res;
  }

  async linkChannelOrder(connectionId: string, input: unknown) {
    const data = ChannelOrderLinkSchema.parse(input);
    const res = await this.repo().linkChannelOrder(connectionId, data.externalOrderId, data.orderId, data.raw);
    await writeAudit(this.tenantId, this.actorUserId, 'integration.linkOrder', 'ChannelOrder', res.id, data);
    return res;
  }
}
