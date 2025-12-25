import { JobRepository } from "@/repositories/jobRepository";
import type { Job } from "@prisma/client";

const defaultBackoff = (attempt: number) => {
  const base = 1000 * Math.pow(2, Math.max(0, attempt - 1));
  return Math.min(base, 5 * 60 * 1000); // cap at 5 minutes
};

type JobEvent =
  | { type: "job.completed"; tenantId: string; jobId: string }
  | { type: "job.retry"; tenantId: string; jobId: string; delayMs: number; error?: string }
  | { type: "job.dead"; tenantId: string; jobId: string; error?: string }
  | { type: "job.running"; tenantId: string; jobId: string };

export class JobEngine {
  constructor(private repo = new JobRepository(), private backoff = defaultBackoff) {}

  async claimNext(tenantId: string): Promise<Job | null> {
    const job = await this.repo.claimNext(tenantId);
    if (job) {
      return job;
    }
    return null;
  }

  async runNext(
    tenantId: string,
    handler: (job: Job) => Promise<void>
  ): Promise<{ job: Job | null; events: JobEvent[] }> {
    const job = await this.claimNext(tenantId);
    if (!job) return { job: null, events: [] };

    const runningEvent: JobEvent = { type: "job.running", tenantId, jobId: job.id };

    try {
      await handler(job);
      await this.repo.markCompleted(tenantId, job.id);
      return { job, events: [runningEvent, { type: "job.completed", tenantId, jobId: job.id }] };
    } catch (err: any) {
      const attempts = job.attempts; // already incremented in claim
      if (attempts >= job.maxAttempts) {
        await this.repo.markDead(tenantId, job.id, err?.message);
        return { job, events: [runningEvent, { type: "job.dead", tenantId, jobId: job.id, error: err?.message }] };
      }
      const delay = this.backoff(attempts);
      await this.repo.reschedule(tenantId, job.id, delay, err?.message);
      return {
        job,
        events: [runningEvent, { type: "job.retry", tenantId, jobId: job.id, delayMs: delay, error: err?.message }]
      };
    }
  }
}
