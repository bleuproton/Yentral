'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiClient';

function getTenantId(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|;\s*)tenantId=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export default function TicketsPage() {
  const tenantId = getTenantId();
  const [tickets, setTickets] = useState<any[]>([]);
  const [form, setForm] = useState<any>({});

  const load = async () => {
    if (!tenantId) return;
    const res = await apiFetch(`/api/tenants/${tenantId}/tickets`);
    setTickets(res?.data ?? []);
  };

  useEffect(() => {
    load();
  }, [tenantId]);

  const createTicket = async () => {
    if (!tenantId) return;
    await apiFetch(`/api/tenants/${tenantId}/tickets`, { method: 'POST', body: JSON.stringify(form) });
    setForm({});
    await load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tickets</h1>
      </div>
      <div className="bg-white p-3 rounded border space-y-2 max-w-xl">
        <div className="font-semibold text-sm">Create ticket</div>
        <input
          className="border rounded px-2 py-1 w-full text-sm"
          placeholder="Title"
          value={form.title || ''}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          className="border rounded px-2 py-1 w-full text-sm"
          placeholder="Description"
          value={form.description || ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <button onClick={createTicket} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
          Create
        </button>
      </div>
      <table className="min-w-full border bg-white text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-700">
            <th className="px-2 py-1 text-left">Title</th>
            <th className="px-2 py-1 text-left">Status</th>
            <th className="px-2 py-1 text-left">Priority</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id} className="border-t">
              <td className="px-2 py-1">
                <Link className="text-blue-600" href={`/app/tickets/${t.id}`}>
                  {t.title}
                </Link>
              </td>
              <td className="px-2 py-1">{t.status}</td>
              <td className="px-2 py-1">{t.priority}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
