import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getServerAuthSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { Sidebar } from '@/ui/sidebar';
import { Topbar } from '@/ui/topbar';
import { getActiveTenantId, setActiveTenantId } from '@/lib/tenant';
import { Role } from '@prisma/client';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const devBypass = process.env.NODE_ENV === 'development' && process.env.DEV_BYPASS_AUTH === '1';
  const session = devBypass ? null : await getServerAuthSession();
  if (!devBypass && !session?.user?.id) {
    redirect('/login');
  }

  let memberships: any[] = [];
  if (!devBypass && session?.user?.id) {
    memberships = await prisma.membership.findMany({
      where: { userId: session.user.id },
      include: { tenant: true },
    });
  } else if (devBypass) {
    memberships = await prisma.membership.findMany({ include: { tenant: true } });
  }

  const activeTenant = getActiveTenantId() || memberships[0]?.tenantId;
  if (!activeTenant) {
    redirect('/select-tenant');
  }
  setActiveTenantId(activeTenant);
  const currentMembership = memberships.find((m) => m.tenantId === activeTenant);
  const role = (currentMembership?.role as Role | undefined) ?? undefined;
  return (
    <div className="min-h-screen flex flex-col">
      <Topbar userEmail={session?.user?.email} />
      <div className="flex">
        <Sidebar role={role} />
        <main className="flex-1 p-6 bg-gray-50 min-h-screen">{children}</main>
      </div>
    </div>
  );
}
