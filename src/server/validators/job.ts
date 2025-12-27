import { z } from 'zod';

export const JobEnqueueSchema = z.object({
  type: z.string().min(1),
  payload: z.any(),
  dedupeKey: z.string().optional(),
  correlationId: z.string().optional(),
  nextRunAt: z.coerce.date().optional(),
  priority: z.number().optional(),
});
