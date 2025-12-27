'use client';

import { useEffect, useState } from 'react';
import { apiClientFetch } from '@/client/api';

type Flow = { id: string; name: string; slug?: string };

export default function AutomationsPage() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    apiClientFetch('/api/flows')
      .then((res) => setFlows(res?.data ?? []))
      .catch(() => {});
  }, []);

  const publishVersion = async () => {
    if (!selected) return;
    await apiClientFetch(`/api/flows/${selected}/versions`, { method: 'POST', body: JSON.stringify({ definition: { nodes: [], edges: [] } }) });
    setMsg('Published new version');
  };

  const runNow = async () => {
    if (!selected) return;
    await apiClientFetch(`/api/flow-runs`, { method: 'POST', body: JSON.stringify({ flowId: selected, input: {} }) });
    setMsg('Run started');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="space-y-2">
        <div className="font-semibold">Flows</div>
        <div className="space-y-1">
          {flows.map((f) => (
            <div
              key={f.id}
              className={`border rounded px-3 py-2 cursor-pointer ${selected === f.id ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}
              onClick={() => setSelected(f.id)}
            >
              {f.name}
            </div>
          ))}
        </div>
      </div>
      <div className="lg:col-span-2 border rounded min-h-[400px] p-4 bg-white">
        <div className="text-sm text-gray-600 mb-2">Flow canvas (React Flow placeholder)</div>
        <div className="border-dashed border-2 border-gray-300 h-80 flex items-center justify-center text-gray-400">Canvas</div>
      </div>
      <div className="space-y-3">
        <div className="bg-white border rounded p-3">
          <div className="font-semibold mb-2">Actions</div>
          <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm" onClick={publishVersion} disabled={!selected}>
            Publish version
          </button>
          <button className="ml-2 px-3 py-1 bg-gray-200 rounded text-sm" onClick={runNow} disabled={!selected}>
            Run now
          </button>
          {msg && <div className="text-green-700 text-xs mt-2">{msg}</div>}
        </div>
        <div className="bg-white border rounded p-3">
          <div className="font-semibold mb-2">Webhook</div>
          <div className="text-xs text-gray-600 break-all">/api/webhooks/[endpointId]</div>
        </div>
      </div>
    </div>
  );
}
