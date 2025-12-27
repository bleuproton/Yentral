import { Job } from '@prisma/client';
import { getProcessor } from '@/server/jobs/processors';

export function runJobHandler(job: Job, correlationId?: string) {
  const handler = getProcessor(job.type);
  if (!handler) throw new Error(`No handler for job type ${job.type}`);
  return handler(job, correlationId);
}
