import { JobStatus } from '@prisma/client';
import { prisma } from '@/server/db/prisma';
import { runJobHandler } from './handlers';

export async function processJob(job: any) {
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
    const attempts = job.attempts + 1;
    const backoffSec = Math.min(60 * 2 ** (attempts - 1), 3600);
    const retry = attempts < job.maxAttempts;
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: retry ? JobStatus.PENDING : JobStatus.FAILED,
        lockedAt: null,
        finishedAt: retry ? null : new Date(),
        lastError: err?.message ?? 'Job failed',
        nextRunAt: retry ? new Date(Date.now() + backoffSec * 1000) : null,
      },
    });
    await prisma.jobRun.update({
      where: { id: run.id },
      data: { status: JobStatus.FAILED, finishedAt: new Date(), error: err?.message ?? 'Job failed' },
    });
  }
}
