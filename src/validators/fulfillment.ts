import { z } from "zod";

export const shipmentLineSchema = z.object({
  orderLineId: z.string().min(1),
  variantId: z.string().min(1),
  qty: z.number().int().positive()
});

export const createShipmentSchema = z.object({
  orderId: z.string().min(1),
  warehouseId: z.string().min(1),
  carrier: z.string().optional(),
  trackingNo: z.string().optional(),
  lines: z.array(shipmentLineSchema).min(1)
});

export const shipShipmentSchema = z.object({
  shippedAt: z.coerce.date().optional(),
  carrier: z.string().optional(),
  trackingNo: z.string().optional()
});

export const deliverShipmentSchema = z.object({
  deliveredAt: z.coerce.date().optional()
});

export const cancelShipmentSchema = z.object({
  reason: z.string().optional()
});
