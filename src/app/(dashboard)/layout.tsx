import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getActiveTenantId } from "@/lib/tenant";
import { Role } from "@prisma/client";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import styles from "./dashboard.module.css";

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
  const currentMembership = memberships.find((m) => m.tenantId === activeTenant);
  const role = (currentMembership?.role as Role | undefined) ?? undefined;
  return (
    <div className={styles.root}>
      <DashboardSidebar />
      <div className={styles.content}>
        <div className={styles.header}>
          <DashboardHeader title="Dashboard" description="Multi-tenant commerce console" />
        </div>
        <main className={styles.main}>
          <div className={styles.inner}>{children}</div>
        </main>
      </div>
    </div>
  );
}
