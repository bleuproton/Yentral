import { z } from 'zod';

export const ProductCreateSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  priceCents: z.number(),
  currency: z.string().optional(),
  status: z.string().optional(),
});

export const ProductUpdateSchema = ProductCreateSchema.partial();

export const VariantCreateSchema = z.object({
  productId: z.string().min(1),
  sku: z.string().min(1),
  ean: z.string().optional(),
  attributes: z.any().optional(),
});

export const VariantUpdateSchema = VariantCreateSchema.partial().omit({ productId: true, sku: true });
