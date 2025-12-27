import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { getServerAuthSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AccountantPage() {
  const session = await getServerAuthSession();
  const tenantId = cookies().get('tenantId')?.value;
  if (!tenantId) redirect('/select-tenant');
  const membership = session?.user?.id
    ? await prisma.membership.findUnique({
        where: { tenantId_userId: { tenantId, userId: session.user.id } },
      })
    : null;
  const role = membership?.role;
  if (!role || !['OWNER', 'ADMIN', 'ACCOUNTANT_ADMIN', 'ACCOUNTANT_READONLY'].includes(role)) {
    redirect('/dashboard');
  }
  const exports = await prisma.reportExport.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 5 });
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Accountant</h1>
      <section className="bg-white p-4 rounded border">
        <h2 className="font-semibold mb-2">Recent Exports</h2>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="px-2 py-1">Type</th>
              <th className="px-2 py-1">Status</th>
              <th className="px-2 py-1">From</th>
              <th className="px-2 py-1">To</th>
            </tr>
          </thead>
          <tbody>
            {exports.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="px-2 py-1">{e.type}</td>
                <td className="px-2 py-1">{e.status}</td>
                <td className="px-2 py-1">{e.periodStart.toISOString().slice(0, 10)}</td>
                <td className="px-2 py-1">{e.periodEnd.toISOString().slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
