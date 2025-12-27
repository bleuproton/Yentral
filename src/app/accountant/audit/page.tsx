import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AccountantAuditLogPage() {
  const tenantId = cookies().get('tenantId')?.value;
  if (!tenantId) redirect('/select-tenant');
  const events = await prisma.auditEvent.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Audit Log</h1>
      <table className="min-w-full text-sm bg-white border">
        <thead>
          <tr className="bg-gray-50 text-gray-700">
            <th className="px-3 py-2 text-left">When</th>
            <th className="px-3 py-2 text-left">Action</th>
            <th className="px-3 py-2 text-left">Resource</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id} className="border-t">
              <td className="px-3 py-2">{e.createdAt.toISOString()}</td>
              <td className="px-3 py-2">{e.action}</td>
              <td className="px-3 py-2">
                {e.resourceType} {e.resourceId}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
