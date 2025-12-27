import { DataTable } from '@/components/DataTable';

const rows = [
  { shipment: 'SHP-1001', status: 'CREATED', carrier: 'DHL' },
  { shipment: 'SHP-1002', status: 'SHIPPED', carrier: 'UPS' },
];

export default function FulfillmentPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Fulfillment</h1>
        <p className="text-sm text-gray-600">Shipments and pick/pack flow.</p>
      </header>
      <DataTable
        columns={[
          { key: 'shipment', header: 'Shipment' },
          { key: 'status', header: 'Status' },
          { key: 'carrier', header: 'Carrier' },
        ]}
        data={rows}
        emptyText="Shipments will appear here."
      />
    </div>
  );
}
