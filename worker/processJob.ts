import { Job, JobStatus } from '@prisma/client';
import { prisma, tenantDb, writeAuditEvent } from './deps';
import { runJobHandler } from './handlers';

const MAX_BACKOFF_MIN = 240;

export async function processJob(job: Job) {
  const run = await prisma.jobRun.create({
    data: {
      tenantId: job.tenantId,
      jobId: job.id,
      jobName: job.type,
      status: JobStatus.RUNNING,
      startedAt: new Date(),
      maxAttempts: job.maxAttempts,
    },
  });

  try {
    await runJobHandler(job);
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: JobStatus.COMPLETED,
        finishedAt: new Date(),
        lockedAt: null,
        lastError: null,
      },
    });
    await prisma.jobRun.update({
      where: { id: run.id },
      data: { status: JobStatus.COMPLETED, finishedAt: new Date() },
    });
  } catch (err: any) {
    const attempts = job.attempts;
    const backoffMin = Math.min(Math.pow(2, attempts), MAX_BACKOFF_MIN);
    const retry = attempts < job.maxAttempts;
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: retry ? JobStatus.PENDING : JobStatus.FAILED,
        lockedAt: null,
        finishedAt: retry ? null : new Date(),
        lastError: err?.message ?? 'Job failed',
        nextRunAt: retry ? new Date(Date.now() + backoffMin * 60 * 1000) : null,
      },
    });
    await prisma.jobRun.update({
      where: { id: run.id },
      data: { status: JobStatus.FAILED, finishedAt: new Date(), error: err?.message ?? 'Job failed' },
    });
  }
}
