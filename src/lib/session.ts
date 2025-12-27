import { getServerAuthSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function requireSessionWithMemberships() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { session: null, memberships: [] };
  }
  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id },
    include: { tenant: true },
  });
  return { session, memberships };
}
