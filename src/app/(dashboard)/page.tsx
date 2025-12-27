import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { getServerAuthSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

async function getCounts(tenantId: string) {
  const [integrations, jobs, tickets] = await Promise.all([
    prisma.integrationConnection.count({ where: { tenantId } }),
    prisma.job.count({ where: { tenantId, status: 'PENDING' } }),
    prisma.ticket.count({ where: { tenantId, status: 'OPEN' } }),
  ]);
  return { integrations, jobs, tickets, lowStock: 0 };
}

export default async function DashboardPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) redirect('/');
  const tenantId = cookies().get('tenantId')?.value;
  if (!tenantId) redirect('/app/settings/tenants');
  const counts = await getCounts(tenantId);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card title="Integrations" value={counts.integrations} />
      <Card title="Jobs pending" value={counts.jobs} />
      <Card title="Tickets open" value={counts.tickets} />
      <Card title="Low stock alerts" value={counts.lowStock} />
    </div>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white shadow-sm rounded p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
