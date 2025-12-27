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
    await prisma.$executeRawUnsafe(
      `UPDATE "Job" SET status = $1::"JobStatus", "finishedAt" = now(), "lockedAt" = NULL, "lastError" = NULL WHERE id = $2 AND "tenantId" = $3`,
      JobStatus.COMPLETED,
      job.id,
      job.tenantId
    );
    await prisma.jobRun.updateMany({
      where: { id: run.id, tenantId: job.tenantId },
      data: { status: JobStatus.COMPLETED, finishedAt: new Date() },
    });
  } catch (err: any) {
    logError(job.tenantId, job.id, correlationId, err?.message ?? 'Job failed');
    const attempts = job.attempts;
    const backoffMin = Math.min(Math.pow(2, attempts), MAX_BACKOFF_MIN);
    const retry = attempts < job.maxAttempts;
    const nextRun = retry ? new Date(Date.now() + backoffMin * 60 * 1000) : null;
    await prisma.$executeRawUnsafe(
      `UPDATE "Job" SET status = $1::"JobStatus", "lockedAt" = NULL, "finishedAt" = $2, "lastError" = $3, "nextRunAt" = $4 WHERE id = $5 AND "tenantId" = $6`,
      retry ? JobStatus.PENDING : JobStatus.FAILED,
      retry ? null : new Date(),
      err?.message ?? 'Job failed',
      nextRun,
      job.id,
      job.tenantId
    );
    await prisma.jobRun.updateMany({
      where: { id: run.id, tenantId: job.tenantId },
      data: { status: JobStatus.FAILED, finishedAt: new Date(), error: err?.message ?? 'Job failed' },
    });
  }
}
