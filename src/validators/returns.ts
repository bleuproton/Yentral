import { z } from "zod";

export const returnLineSchema = z.object({
  orderLineId: z.string().min(1),
  variantId: z.string().min(1),
  qty: z.number().int().positive(),
  condition: z.string().optional()
});

export const createReturnSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().optional(),
  lines: z.array(returnLineSchema).min(1)
});

export const approveReturnSchema = z.object({});

export const receiveReturnSchema = z.object({
  receivedAt: z.coerce.date().optional(),
  restockWarehouseId: z.string().min(1).optional()
});

export const refundReturnSchema = z.object({});
