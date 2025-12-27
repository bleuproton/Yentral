// @ts-nocheck
import { PrismaClient } from '@prisma/client';

export class OrderRepository {
  constructor(private prisma: PrismaClient, private tenantId: string) {}

  listOrders(filters: { status?: string } = {}) {
    const where: any = { tenantId: this.tenantId };
    if (filters.status) where.status = filters.status;
    return this.prisma.order.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  getOrder(id: string) {
    return this.prisma.order.findUnique({ where: { tenantId_id: { tenantId: this.tenantId, id } } });
  }
}
