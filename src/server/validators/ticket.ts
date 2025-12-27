import { z } from 'zod';

export const TicketCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  emailThreadId: z.string().optional(),
  priority: z.string().optional(),
});

export const TicketUpdateSchema = TicketCreateSchema.partial();
