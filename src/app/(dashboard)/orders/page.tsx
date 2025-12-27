import { DataTable } from '@/components/DataTable';

const rows = [
  { orderNumber: 'SO-1001', status: 'PENDING', total: '€120.00' },
  { orderNumber: 'SO-1002', status: 'FULFILLED', total: '€89.00' },
];

export default function OrdersPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Orders</h1>
        <p className="text-sm text-gray-600">Multi-channel orders overview.</p>
      </header>
      <DataTable
        columns={[
          { key: 'orderNumber', header: 'Order #' },
          { key: 'status', header: 'Status' },
          { key: 'total', header: 'Total' },
        ]}
        data={rows}
        emptyText="Orders will appear here."
      />
    </div>
  );
}
