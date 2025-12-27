import { DataTable } from '@/components/DataTable';

const rows = [
  { name: 'Acme BV', email: 'info@acme.test', country: 'NL' },
  { name: 'Contoso LLC', email: 'ops@contoso.test', country: 'US' },
];

export default function CustomersPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Customers</h1>
        <p className="text-sm text-gray-600">Accounts, contacts, and communication.</p>
      </header>
      <DataTable
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'email', header: 'Email' },
          { key: 'country', header: 'Country' },
        ]}
        data={rows}
        emptyText="Customers will appear here."
      />
    </div>
  );
}
