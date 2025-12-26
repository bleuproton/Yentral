import { prisma } from "@/lib/prisma";

export class TenantService {
  async getTenantForUser(userId: string, tenantId: string) {
    const membership = await prisma.membership.findFirst({
      where: { userId, tenantId },
      include: { tenant: true }
    });
    if (!membership) throw new Error("Access denied for tenant");
    return membership.tenant;
  }
}
