// @ts-nocheck
import { PrismaClient } from '@prisma/client';

export class JobRepository {
  constructor(private prisma: PrismaClient, private tenantId: string) {}

  async enqueueJob(data: {
    type: string;
    payload: any;
    scheduledAt?: Date;
    dedupeKey?: string;
    priority?: number;
  }) {
    try {
      return await this.prisma.job.create({
        data: {
          tenantId: this.tenantId,
          type: data.type,
          payload: data.payload,
          scheduledAt: data.scheduledAt,
          dedupeKey: data.dedupeKey ?? null,
          priority: data.priority ?? 0,
        },
      });
    } catch (err: any) {
      if (data.dedupeKey && err?.code === 'P2002') {
        const existing = await this.prisma.job.findFirst({
          where: { tenantId: this.tenantId, dedupeKey: data.dedupeKey },
        });
        if (existing) return existing;
      }
      throw err;
    }
  }

  listJobs(filters: { status?: string } = {}) {
    const where: any = { tenantId: this.tenantId };
    if (filters.status) where.status = filters.status;
    return this.prisma.job.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  getJob(jobId: string) {
    return this.prisma.job.findUnique({
      where: { tenantId_id: { tenantId: this.tenantId, id: jobId } },
    });
  }
}
