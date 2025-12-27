import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AccountantInvoicesPage() {
  const tenantId = cookies().get('tenantId')?.value;
  if (!tenantId) redirect('/select-tenant');
  const invoices = await prisma.invoice.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 20 });
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Invoices</h1>
      <table className="min-w-full text-sm bg-white border">
        <thead>
          <tr className="bg-gray-50 text-gray-700">
            <th className="px-3 py-2 text-left">Invoice #</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2 text-left">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-t">
              <td className="px-3 py-2">{inv.invoiceNumber}</td>
              <td className="px-3 py-2">{inv.status}</td>
              <td className="px-3 py-2">{(inv.totalCents / 100).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
