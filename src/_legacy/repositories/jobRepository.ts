import { prisma } from "@/lib/prisma";
import { JobStatus, Prisma } from "@prisma/client";
import type { Job } from "@prisma/client";

type CreateJobInput = Omit<Prisma.JobUncheckedCreateInput, "tenantId"> & { tenantId: string };
type UpdateJobInput = Prisma.JobUncheckedUpdateInput;

export class JobRepository {
  async getById(tenantId: string, id: string): Promise<Job | null> {
    return prisma.job.findFirst({ where: { tenantId, id } });
  }

  async list(tenantId: string, opts?: { status?: string; connectionId?: string }) {
    return prisma.job.findMany({
      where: {
        tenantId,
        status: opts?.status as any,
        connectionId: opts?.connectionId
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async create(data: CreateJobInput) {
    return prisma.job.create({ data });
  }

  async update(id: string, data: UpdateJobInput) {
    return prisma.job.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.job.delete({ where: { id } });
  }

  async claimNext(tenantId: string) {
    const [job] = await prisma.$queryRaw<Job[]>(Prisma.sql`
      UPDATE "Job"
      SET status = 'RUNNING', "startedAt" = now(), attempts = attempts + 1
      WHERE id = (
        SELECT id FROM "Job"
        WHERE "tenantId" = ${tenantId}
          AND status = 'PENDING'
          AND ("scheduledAt" IS NULL OR "scheduledAt" <= now())
        ORDER BY "createdAt" ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING *;
    `);
    return job ?? null;
  }

  async reschedule(tenantId: string, jobId: string, delayMs: number, error?: string) {
    const next = new Date(Date.now() + delayMs);
    return prisma.job.update({
      where: { id: jobId },
      data: { status: JobStatus.PENDING, scheduledAt: next, error }
    });
  }

  async markCompleted(tenantId: string, jobId: string) {
    return prisma.job.update({
      where: { id: jobId },
      data: { status: JobStatus.COMPLETED, finishedAt: new Date() }
    });
  }

  async markDead(tenantId: string, jobId: string, error?: string) {
    return prisma.job.update({
      where: { id: jobId },
      data: { status: JobStatus.FAILED, error: error ?? "dead-letter", finishedAt: new Date() }
    });
  }
}
