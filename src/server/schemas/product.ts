import { z } from 'zod';

export const ProductCreateSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  priceCents: z.number().int().nonnegative(),
  currency: z.string().default('EUR'),
  status: z.string().optional(),
});

export const ProductUpdateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  priceCents: z.number().int().nonnegative().optional(),
  currency: z.string().optional(),
  status: z.string().optional(),
});

export const VariantCreateSchema = z.object({
  sku: z.string().min(1),
  ean: z.string().optional(),
  attributes: z.any().optional(),
});

export const VariantUpdateSchema = z.object({
  ean: z.string().optional(),
  attributes: z.any().optional(),
});
