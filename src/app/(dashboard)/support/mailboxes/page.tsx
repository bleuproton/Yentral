'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiClient';

export default function MailboxesPage() {
  const [mailboxes, setMailboxes] = useState<any[]>([]);

  useEffect(() => {
    apiFetch('/api/v1/mailboxes')
      .then((res) => setMailboxes(res ?? []))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Mailboxes</h1>
      <table className="min-w-full bg-white border text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-700">
            <th className="px-2 py-1 text-left">Name</th>
            <th className="px-2 py-1 text-left">Inbound</th>
          </tr>
        </thead>
        <tbody>
          {mailboxes.map((m: any) => (
            <tr key={m.id} className="border-t">
              <td className="px-2 py-1">{m.name}</td>
              <td className="px-2 py-1">{m.inboundAddress}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-xs text-gray-500">Threads/messages API not exposed; display only mailboxes.</div>
    </div>
  );
}
