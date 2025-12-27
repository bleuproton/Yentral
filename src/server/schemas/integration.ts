import { z } from 'zod';

export const IntegrationCreateSchema = z.object({
  connectorVersionId: z.string().min(1),
  name: z.string().optional(),
  region: z.string().optional(),
  status: z.string().optional(),
  config: z.any().optional(),
});

export const IntegrationUpdateSchema = z.object({
  name: z.string().optional(),
  region: z.string().optional(),
  status: z.string().optional(),
  config: z.any().optional(),
  lastSyncAt: z.coerce.date().optional(),
  lastError: z.string().nullable().optional(),
});

export const WarehouseMappingUpsertSchema = z.object({
  externalLocationId: z.string().min(1),
  warehouseId: z.string().min(1),
});

export const ChannelProductLinkSchema = z.object({
  externalId: z.string().min(1),
  productId: z.string().min(1),
  raw: z.any().optional(),
});

export const ChannelVariantLinkSchema = z.object({
  externalId: z.string().min(1),
  variantId: z.string().min(1),
  asin: z.string().optional(),
  externalSku: z.string().optional(),
  raw: z.any().optional(),
});

export const ChannelOrderLinkSchema = z.object({
  externalOrderId: z.string().min(1),
  orderId: z.string().min(1),
  raw: z.any().optional(),
});
