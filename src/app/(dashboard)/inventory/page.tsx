import { DataTable } from '@/components/DataTable';

const rows = [
  { warehouse: 'Main', sku: 'SKU-001', available: 10, reserved: 2 },
  { warehouse: 'FBA-EU', sku: 'SKU-002', available: 5, reserved: 1 },
];

export default function InventoryPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Inventory</h1>
        <p className="text-sm text-gray-600">Stock snapshots per warehouse and variant.</p>
      </header>
      <DataTable
        columns={[
          { key: 'warehouse', header: 'Warehouse' },
          { key: 'sku', header: 'SKU' },
          { key: 'available', header: 'Available' },
          { key: 'reserved', header: 'Reserved' },
        ]}
        data={rows}
        emptyText="No inventory yet."
      />
    </div>
  );
}
