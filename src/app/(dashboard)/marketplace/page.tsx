'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiClient';

function getTenantId(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|;\s*)tenantId=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export default function MarketplacePage() {
  const tenantId = getTenantId();
  const [plugins, setPlugins] = useState<any[]>([]);
  const [connectors, setConnectors] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/api/tenants/' + tenantId + '/plugins').then((res) => setPlugins(res?.data ?? []));
    apiFetch('/api/connectors').then((res) => setConnectors(res?.data ?? []));
    if (tenantId) {
      apiFetch('/api/tenants/' + tenantId + '/integrations').then((res) => setConnections(res?.data ?? []));
    }
  }, [tenantId]);

  const install = async (pluginId: string) => {
    if (!tenantId) return;
    await apiFetch('/api/tenants/' + tenantId + '/plugins', {
      method: 'POST',
      body: JSON.stringify({ pluginId, enabled: true }),
    });
    const res = await apiFetch('/api/tenants/' + tenantId + '/plugins');
    setPlugins(res?.data ?? []);
    setMsg('Plugin installed');
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Marketplace</h1>
      {msg && <div className="text-green-700 text-sm">{msg}</div>}
      <section className="bg-white p-4 rounded border space-y-2">
        <h2 className="font-semibold">Plugins</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {plugins.map((p) => (
            <div key={p.id} className="border rounded p-3 text-sm">
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-gray-500">{p.description || 'No description'}</div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs">{p.installed ? 'Installed' : 'Not installed'}</span>
                {!p.installed && (
                  <button onClick={() => install(p.id)} className="px-2 py-1 bg-blue-600 text-white rounded text-xs">
                    Install
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-white p-4 rounded border space-y-2">
        <h2 className="font-semibold">Connectors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {connectors.map((c) => (
            <div key={c.id} className="border rounded p-3">
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-gray-500">Type: {c.type}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-white p-4 rounded border space-y-2">
        <h2 className="font-semibold">Connections</h2>
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-700">
              <th className="px-2 py-1 text-left">Name</th>
              <th className="px-2 py-1 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {connections.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-2 py-1">{c.name || c.id}</td>
                <td className="px-2 py-1">{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
