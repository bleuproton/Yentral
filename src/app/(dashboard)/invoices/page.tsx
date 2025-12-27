import { DataTable } from '@/components/DataTable';

const rows = [
  { number: 'INV-5001', status: 'DRAFT', total: '€120.00' },
  { number: 'INV-5002', status: 'PAID', total: '€89.00' },
];

export default function InvoicesPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Invoices</h1>
        <p className="text-sm text-gray-600">Billing and compliance per legal entity.</p>
      </header>
      <DataTable
        columns={[
          { key: 'number', header: 'Invoice #' },
          { key: 'status', header: 'Status' },
          { key: 'total', header: 'Total' },
        ]}
        data={rows}
        emptyText="Invoices will appear here."
      />
    </div>
  );
}
