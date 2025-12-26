import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class CustomerService {
  upsertCustomer(tenantId: string, data: Prisma.CustomerUncheckedCreateInput) {
    return prisma.customer.upsert({
      where: { tenantId_email: { tenantId, email: (data as any).email ?? "" } },
      update: data,
      create: { ...data, tenantId }
    });
  }

  getCustomer(tenantId: string, id: string) {
    return prisma.customer.findFirst({ where: { tenantId, id } });
  }

  listCustomers(tenantId: string, opts?: { q?: string; take?: number; skip?: number }) {
    return prisma.customer.findMany({
      where: {
        tenantId,
        OR: opts?.q
          ? [
              { email: { contains: opts.q, mode: "insensitive" } },
              { name: { contains: opts.q, mode: "insensitive" } },
              { companyName: { contains: opts.q, mode: "insensitive" } }
            ]
          : undefined
      },
      orderBy: { createdAt: "desc" },
      take: opts?.take,
      skip: opts?.skip
    });
  }

  deleteCustomer(tenantId: string, id: string) {
    return prisma.customer.deleteMany({ where: { tenantId, id } });
  }
}
