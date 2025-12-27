'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiClient';

function getTenantId(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|;\s*)tenantId=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export default function IntegrationsPage() {
  const tenantId = getTenantId();
  const [connectors, setConnectors] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [form, setForm] = useState<any>({});
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/api/connectors').then((res) => setConnectors(res?.data ?? []));
  }, []);

  useEffect(() => {
    if (!tenantId) return;
    apiFetch(`/api/tenants/${tenantId}/integrations`).then((res) => setConnections(res?.data ?? []));
  }, [tenantId]);

  const createConnection = async () => {
    if (!tenantId) return;
    await apiFetch(`/api/tenants/${tenantId}/integrations`, {
      method: 'POST',
      body: JSON.stringify(form),
    });
    const res = await apiFetch(`/api/tenants/${tenantId}/integrations`);
    setConnections(res?.data ?? []);
    setMsg('Connection created');
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Integrations</h1>
      {msg && <div className="text-green-700 text-sm">{msg}</div>}
      <section className="bg-white p-4 rounded border">
        <h2 className="font-semibold mb-2">Marketplace</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {connectors.map((c) => (
            <div key={c.id} className="border rounded p-2">
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-gray-500">Type: {c.type}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-white p-4 rounded border space-y-2">
        <h2 className="font-semibold">Create connection</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Input label="ConnectorVersionId" onChange={(v) => setForm({ ...form, connectorVersionId: v })} />
          <Input label="Name" onChange={(v) => setForm({ ...form, name: v })} />
          <Input label="Region" onChange={(v) => setForm({ ...form, region: v })} />
          <Input label="Config (JSON)" onChange={(v) => setForm({ ...form, config: parseJsonSafe(v) })} />
        </div>
        <button onClick={createConnection} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
          Create
        </button>
      </section>
      <section className="bg-white p-4 rounded border">
        <h2 className="font-semibold mb-2">Connections</h2>
        <table className="min-w-full text-sm border">
          <thead>
            <tr className="bg-gray-50 text-gray-700">
              <th className="px-2 py-1 text-left">Name</th>
              <th className="px-2 py-1 text-left">Region</th>
              <th className="px-2 py-1 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {connections.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-2 py-1">{c.name || c.id}</td>
                <td className="px-2 py-1">{c.region || '-'}</td>
                <td className="px-2 py-1">{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Input({ label, onChange }: { label: string; onChange: (v: string) => void }) {
  return (
    <label className="text-sm">
      <span className="text-gray-700">{label}</span>
      <input className="border rounded w-full px-2 py-1 mt-1" onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function parseJsonSafe(input: string) {
  try {
    return JSON.parse(input);
  } catch {
    return input;
  }
}
