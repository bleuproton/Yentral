import { PrismaClient } from '@prisma/client';
import { JobRepository } from '../repositories/jobRepository';
import { JobEnqueueSchema } from '../schemas/job';
import { writeAudit } from '../audit/audit';

export class JobService {
  constructor(private prisma: PrismaClient, private tenantId: string, private actorUserId: string) {}

  repo() {
    return new JobRepository(this.prisma, this.tenantId);
  }

  async enqueue(input: unknown) {
    const data = JobEnqueueSchema.parse(input);
    const job = await this.repo().enqueueJob(data);
    await writeAudit(this.tenantId, this.actorUserId, 'job.enqueue', 'Job', job.id, { type: job.type });
    return job;
  }

  list(filters: { status?: string }) {
    return this.repo().listJobs(filters);
  }

  get(jobId: string) {
    return this.repo().getJob(jobId);
  }
}
