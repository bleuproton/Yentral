import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireTenantAccess(tenantId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    throw new Error("Unauthorized");
  }
  const membership = await prisma.membership.findFirst({
    where: { tenantId, userId: session.user.id }
  });
  if (!membership) {
    throw new Error("Forbidden");
  }
  return { userId: session.user.id, tenantId };
}
