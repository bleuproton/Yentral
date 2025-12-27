import { DataTable } from '@/components/DataTable';

const rows = [
  { mailbox: 'support@demo.test', threads: 3, status: 'Active' },
  { mailbox: 'returns@demo.test', threads: 1, status: 'Active' },
];

export default function EmailPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Email & Threads</h1>
        <p className="text-sm text-gray-600">Mailboxes, threads, and messages.</p>
      </header>
      <DataTable
        columns={[
          { key: 'mailbox', header: 'Mailbox' },
          { key: 'threads', header: 'Threads' },
          { key: 'status', header: 'Status' },
        ]}
        data={rows}
        emptyText="Mailboxes will appear here."
      />
    </div>
  );
}
