// @ts-nocheck
import { prisma } from "@/lib/prisma";
import type { Prisma, Order, OrderLine } from "@prisma/client";

type CreateOrderInput = Omit<Prisma.OrderUncheckedCreateInput, "tenantId"> & { tenantId: string };
type UpdateOrderInput = Prisma.OrderUncheckedUpdateInput;
type CreateOrderLineInput = Omit<Prisma.OrderLineUncheckedCreateInput, "tenantId" | "orderId"> & {
  tenantId: string;
  orderId: string;
};

export class OrderRepository {
  async getById(tenantId: string, id: string): Promise<Order | null> {
    return prisma.order.findFirst({ where: { tenantId, id } });
  }

  async list(tenantId: string, opts?: { status?: string; take?: number; skip?: number }) {
    return prisma.order.findMany({
      where: { tenantId, status: opts?.status as any },
      orderBy: { createdAt: "desc" },
      take: opts?.take,
      skip: opts?.skip
    });
  }

  async create(data: CreateOrderInput) {
    return prisma.order.create({ data });
  }

  async update(id: string, data: UpdateOrderInput) {
    return prisma.order.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.order.delete({ where: { id } });
  }

  async listLines(tenantId: string, orderId: string): Promise<OrderLine[]> {
    return prisma.orderLine.findMany({ where: { tenantId, orderId } });
  }

  async addLine(data: CreateOrderLineInput): Promise<OrderLine> {
    return prisma.orderLine.create({ data });
  }
}
