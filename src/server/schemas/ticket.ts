import { z } from 'zod';

export const TicketCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.number().int().optional(),
  assigneeId: z.string().optional(),
  emailThreadId: z.string().optional(),
});

export const TicketUpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.number().int().optional(),
  assigneeId: z.string().optional(),
  emailThreadId: z.string().optional(),
  slaDueAt: z.coerce.date().optional(),
});
