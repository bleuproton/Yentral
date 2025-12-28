import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getActiveTenantId } from "@/lib/tenant";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const devBypass = process.env.NODE_ENV === "development" && process.env.DEV_BYPASS_AUTH === "1";
  const session = devBypass ? null : await getServerAuthSession();
  if (!devBypass && !session?.user?.id) {
    redirect("/login");
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
    redirect("/select-tenant");
  }

  return (
    <div className="dark min-h-screen bg-[#0b0b0f] text-gray-50 flex">
      <DashboardSidebar />
      <div className="flex-1 lg:pl-72">
        <main className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
