import { DataTable } from '@/components/DataTable';

const rows = [
  { rma: 'RMA-2001', status: 'REQUESTED', reason: 'Damaged' },
  { rma: 'RMA-2002', status: 'RECEIVED', reason: 'Unwanted' },
];

export default function ReturnsPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Returns</h1>
        <p className="text-sm text-gray-600">Return merchandise authorization and restock.</p>
      </header>
      <DataTable
        columns={[
          { key: 'rma', header: 'RMA' },
          { key: 'status', header: 'Status' },
          { key: 'reason', header: 'Reason' },
        ]}
        data={rows}
        emptyText="Returns will appear here."
      />
    </div>
  );
}
