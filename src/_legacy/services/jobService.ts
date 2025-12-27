// @ts-nocheck
import { JobStatus } from "@prisma/client";
import { JobRepository } from "@/_legacy/repositories/jobRepository";

export class JobService {
  constructor(private repo = new JobRepository()) {}

  async enqueue(tenantId: string, input: { type: string; payload: Record<string, unknown>; connectionId?: string }) {
    const job = await this.repo.create({
      tenantId,
      type: input.type,
      payload: input.payload,
      status: JobStatus.PENDING,
      connectionId: input.connectionId
    });
    return { job, events: [{ type: "job.enqueued", tenantId, jobId: job.id }] };
  }

  async markRunning(tenantId: string, jobId: string) {
    const job = await this.repo.getById(tenantId, jobId);
    if (!job) throw new Error("Job not found");
    await this.repo.update(jobId, { status: JobStatus.RUNNING, startedAt: new Date() });
    return { events: [{ type: "job.running", tenantId, jobId }] };
  }

  async markCompleted(tenantId: string, jobId: string) {
    const job = await this.repo.getById(tenantId, jobId);
    if (!job) throw new Error("Job not found");
    await this.repo.update(jobId, { status: JobStatus.COMPLETED, finishedAt: new Date() });
    return { events: [{ type: "job.completed", tenantId, jobId }] };
  }

  async markFailed(tenantId: string, jobId: string, error: string) {
    const job = await this.repo.getById(tenantId, jobId);
    if (!job) throw new Error("Job not found");
    await this.repo.update(jobId, { status: JobStatus.FAILED, error, finishedAt: new Date() });
    return { events: [{ type: "job.failed", tenantId, jobId, error }] };
  }
}
