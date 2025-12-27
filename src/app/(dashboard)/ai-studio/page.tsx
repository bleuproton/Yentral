'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiClient';

function getTenantId(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|;\s*)tenantId=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export default function AiStudioPage() {
  const tenantId = getTenantId();
  const [listing, setListing] = useState<any>(null);
  const [support, setSupport] = useState<any>(null);
  const [inventory, setInventory] = useState<any>(null);

  const runAgent = async (agent: string, payload: any, setter: (v: any) => void) => {
    if (!tenantId) return;
    const res = await apiFetch(`/api/tenants/${tenantId}/ai/agents`, {
      method: 'POST',
      body: JSON.stringify({ agent, payload }),
    });
    setter(res?.data);
  };

  useEffect(() => {
    runAgent('listing', { title: 'Sample title', description: 'Sample description' }, setListing);
    runAgent('support', { body: 'My order is delayed' }, setSupport);
    runAgent('inventory', { deltas: [5, -120, 10, 80] }, setInventory);
  }, [tenantId]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">AI Studio</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card title="Listing optimizer" data={listing} />
        <Card title="Support auto-triage" data={support} />
        <Card title="Inventory anomaly detector" data={inventory} />
      </div>
    </div>
  );
}

function Card({ title, data }: { title: string; data: any }) {
  return (
    <div className="bg-white p-4 rounded border text-sm">
      <div className="font-semibold mb-2">{title}</div>
      <pre className="text-xs bg-gray-50 p-2 rounded border">{data ? JSON.stringify(data, null, 2) : 'Loading...'}</pre>
    </div>
  );
}
