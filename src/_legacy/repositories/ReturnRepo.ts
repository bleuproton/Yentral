// @ts-nocheck
import { prisma } from "@/lib/prisma";
import type { Prisma, Return } from "@prisma/client";

export class ReturnRepo {
  create(data: Prisma.ReturnUncheckedCreateInput) {
    return prisma.return.create({ data });
  }

  createLines(data: Prisma.ReturnLineUncheckedCreateInput[]) {
    return prisma.$transaction(data.map((d) => prisma.returnLine.create({ data: d })));
  }

  findById(tenantId: string, id: string) {
    return prisma.return.findFirst({ where: { tenantId, id }, include: { lines: true } });
  }

  list(tenantId: string, filters?: { orderId?: string; status?: string }) {
    return prisma.return.findMany({
      where: { tenantId, orderId: filters?.orderId, status: filters?.status as any },
      orderBy: { createdAt: "desc" },
      include: { lines: true }
    });
  }

  updateStatus(tenantId: string, id: string, data: Prisma.ReturnUpdateInput) {
    return prisma.return.updateMany({ where: { tenantId, id }, data });
  }
}
