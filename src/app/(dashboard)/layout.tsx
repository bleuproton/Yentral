import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getServerAuthSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { Sidebar } from '@/ui/sidebar';
import { Topbar } from '@/ui/topbar';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect('/');
  }
  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id },
    include: { tenant: true },
  });
  const cookieStore = cookies();
  const activeTenant = cookieStore.get('tenantId')?.value || memberships[0]?.tenantId;
  if (!activeTenant && memberships.length === 0) {
    redirect('/settings/tenants');
  }
  if (activeTenant && (!cookieStore.get('tenantId') || cookieStore.get('tenantId')?.value !== activeTenant)) {
    cookieStore.set('tenantId', activeTenant, { path: '/', httpOnly: false });
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Topbar userEmail={session.user.email} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 bg-gray-50 min-h-screen">{children}</main>
      </div>
    </div>
  );
}
