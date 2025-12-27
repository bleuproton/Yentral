// @ts-nocheck
import { prisma } from "@/lib/prisma";
import type { Prisma, IntegrationConnection } from "@prisma/client";

type CreateConnectionInput = Omit<Prisma.IntegrationConnectionUncheckedCreateInput, "tenantId"> & {
  tenantId: string;
};
type UpdateConnectionInput = Prisma.IntegrationConnectionUncheckedUpdateInput;

export class IntegrationConnectionRepository {
  async getById(tenantId: string, id: string): Promise<IntegrationConnection | null> {
    return prisma.integrationConnection.findFirst({ where: { tenantId, id } });
  }

  async list(tenantId: string, opts?: { connectorVersionId?: string; status?: string }) {
    return prisma.integrationConnection.findMany({
      where: {
        tenantId,
        connectorVersionId: opts?.connectorVersionId,
        status: opts?.status as any
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async create(data: CreateConnectionInput) {
    return prisma.integrationConnection.create({ data });
  }

  async update(id: string, data: UpdateConnectionInput) {
    return prisma.integrationConnection.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.integrationConnection.delete({ where: { id } });
  }
}
