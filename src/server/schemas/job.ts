import { z } from 'zod';

export const JobEnqueueSchema = z.object({
  type: z.string().min(1),
  payload: z.any(),
  scheduledAt: z.coerce.date().optional(),
  dedupeKey: z.string().optional(),
  priority: z.number().int().optional(),
});
