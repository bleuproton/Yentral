import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AccountantJournalPage() {
  const tenantId = cookies().get('tenantId')?.value;
  if (!tenantId) redirect('/select-tenant');
  const entries = await prisma.journalEntry.findMany({
    where: { tenantId },
    orderBy: { postedAt: 'desc' },
    take: 20,
    include: { lines: true },
  });
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Journal Entries</h1>
      <table className="min-w-full text-sm bg-white border">
        <thead>
          <tr className="bg-gray-50 text-gray-700">
            <th className="px-3 py-2 text-left">Posted</th>
            <th className="px-3 py-2 text-left">Lines</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-t">
              <td className="px-3 py-2">{e.postedAt.toISOString().slice(0, 10)}</td>
              <td className="px-3 py-2">{e.lines.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
