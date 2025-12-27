import { z } from 'zod';

export const IntegrationConnectionCreateSchema = z.object({
  connectorVersionId: z.string().min(1),
  name: z.string().optional(),
  region: z.string().optional(),
  status: z.string().optional(),
  config: z.any().optional(),
});

export const IntegrationConnectionUpdateSchema = IntegrationConnectionCreateSchema.partial().omit({
  connectorVersionId: true,
});

export const WarehouseMappingUpsertSchema = z.object({
  connectionId: z.string().min(1),
  externalLocationId: z.string().min(1),
  warehouseId: z.string().min(1),
});

export const ChannelProductLinkSchema = z.object({
  connectionId: z.string().min(1),
  externalId: z.string().min(1),
  productId: z.string().min(1),
  raw: z.any().optional(),
});

export const ChannelVariantLinkSchema = z.object({
  connectionId: z.string().min(1),
  externalId: z.string().min(1),
  variantId: z.string().min(1),
  asin: z.string().optional(),
  externalSku: z.string().optional(),
  raw: z.any().optional(),
});

export const ChannelOrderLinkSchema = z.object({
  connectionId: z.string().min(1),
  externalOrderId: z.string().min(1),
  orderId: z.string().min(1),
  raw: z.any().optional(),
});
