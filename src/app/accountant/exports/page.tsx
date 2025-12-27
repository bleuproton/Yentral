import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AccountantExportsPage() {
  const tenantId = cookies().get('tenantId')?.value;
  if (!tenantId) redirect('/select-tenant');
  const exports = await prisma.reportExport.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 20 });
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Exports</h1>
      <table className="min-w-full text-sm bg-white border">
        <thead>
          <tr className="bg-gray-50 text-gray-700">
            <th className="px-3 py-2 text-left">Type</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2 text-left">From</th>
            <th className="px-3 py-2 text-left">To</th>
          </tr>
        </thead>
        <tbody>
          {exports.map((e) => (
            <tr key={e.id} className="border-t">
              <td className="px-3 py-2">{e.type}</td>
              <td className="px-3 py-2">{e.status}</td>
              <td className="px-3 py-2">{e.periodStart.toISOString().slice(0, 10)}</td>
              <td className="px-3 py-2">{e.periodEnd.toISOString().slice(0, 10)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
