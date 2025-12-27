import { Job, JobStatus } from '@prisma/client';
import { prisma } from './deps';
import { runJobHandler } from './handlers';
import { randomUUID } from 'crypto';
import { logError, logInfo } from '@/server/jobs/logger';

const MAX_BACKOFF_MIN = 240;

export async function processJob(job: Job) {
  if (!job.tenantId) {
    throw new Error('Job missing tenantId');
  }
  const correlationId = (job as any).correlationId || randomUUID();
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
    await runJobHandler(job, correlationId);
    logInfo(job.tenantId, job.id, correlationId, 'job.completed');
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
    logError(job.tenantId, job.id, correlationId, err?.message ?? 'Job failed');
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
