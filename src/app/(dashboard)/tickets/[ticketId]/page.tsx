'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiClient';

function getTenantId(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|;\s*)tenantId=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export default function TicketDetailPage({ params }: { params: { ticketId: string } }) {
  const tenantId = getTenantId();
  const [ticket, setTicket] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    if (!tenantId) return;
    const res = await apiFetch(`/api/tenants/${tenantId}/tickets/${params.ticketId}`);
    setTicket(res?.data);
    setForm({
      title: res?.data?.title,
      description: res?.data?.description,
      status: res?.data?.status,
      priority: res?.data?.priority,
    });
  };

  useEffect(() => {
    load();
  }, [tenantId, params.ticketId]);

  const save = async () => {
    if (!tenantId) return;
    await apiFetch(`/api/tenants/${tenantId}/tickets/${params.ticketId}`, {
      method: 'PATCH',
      body: JSON.stringify(form),
    });
    setMsg('Saved');
    await load();
  };

  if (!ticket) return <div>Loading...</div>;

  return (
    <div className="space-y-3 max-w-xl">
      <h1 className="text-xl font-semibold">Ticket</h1>
      {msg && <div className="text-green-700 text-sm">{msg}</div>}
      <Input label="Title" value={form.title || ''} onChange={(v) => setForm({ ...form, title: v })} />
      <textarea
        className="border rounded w-full px-2 py-1 text-sm"
        rows={4}
        value={form.description || ''}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <Input label="Status" value={form.status || ''} onChange={(v) => setForm({ ...form, status: v })} />
      <Input
        label="Priority"
        value={form.priority || 0}
        onChange={(v) => setForm({ ...form, priority: Number(v) })}
        type="number"
      />
      <button onClick={save} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
        Save
      </button>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="text-sm">
      <span className="text-gray-700">{label}</span>
      <input
        className="mt-1 border rounded w-full px-2 py-1"
        value={value}
        type={type}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
