import { DataTable } from '@/components/DataTable';

const sample = [
  { sku: 'SKU-001', name: 'Sample product', status: 'DRAFT' },
  { sku: 'SKU-002', name: 'Sample variant', status: 'ACTIVE' },
];

export default function CatalogPage() {
  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Catalog</h1>
          <p className="text-sm text-gray-600">Products, variants, and attributes.</p>
        </div>
      </header>
      <DataTable
        columns={[
          { key: 'sku', header: 'SKU' },
          { key: 'name', header: 'Name' },
          { key: 'status', header: 'Status' },
        ]}
        data={sample}
        emptyText="Products will appear here."
      />
    </div>
  );
}
