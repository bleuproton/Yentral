import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class IntegrationConnectionService {
  async list(tenantId: string) {
    return prisma.integrationConnection.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" }
    });
  }

  async create(tenantId: string, input: { connectorVersionId: string; config?: Prisma.JsonValue }) {
    return prisma.integrationConnection.create({
      data: {
        tenantId,
        connectorVersionId: input.connectorVersionId,
        config: input.config,
        status: "INACTIVE"
      }
    });
  }

  async updateStatus(tenantId: string, id: string, status: string) {
    return prisma.integrationConnection.update({
      where: { id },
      data: { status },
      select: { id: true, status: true }
    });
  }
}
