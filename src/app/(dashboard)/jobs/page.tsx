'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiClient';

function getTenantId(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|;\s*)tenantId=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export default function JobsPage() {
  const tenantId = getTenantId();
  const [jobs, setJobs] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    if (!tenantId) return;
    const qs = filter ? `?status=${filter}` : '';
    const res = await apiFetch(`/api/tenants/${tenantId}/jobs${qs}`);
    setJobs(res?.data ?? []);
  };

  useEffect(() => {
    load();
  }, [tenantId, filter]);

  const retry = async (job: any) => {
    if (!tenantId) return;
    await apiFetch(`/api/tenants/${tenantId}/jobs`, {
      method: 'POST',
      body: JSON.stringify({ type: job.type, payload: job.payload, dedupeKey: `${job.dedupeKey || job.id}-retry` }),
    });
    setMessage('Retry enqueued');
    await load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Jobs</h1>
        <select className="border rounded px-2 py-1 text-sm" onChange={(e) => setFilter(e.target.value)} value={filter}>
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="RUNNING">Running</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>
      {message && <div className="text-green-700 text-sm">{message}</div>}
      <table className="min-w-full border bg-white text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-700">
            <th className="px-2 py-1 text-left">Type</th>
            <th className="px-2 py-1 text-left">Status</th>
            <th className="px-2 py-1 text-left">Attempts</th>
            <th className="px-2 py-1 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.id} className="border-t">
              <td className="px-2 py-1">{j.type}</td>
              <td className="px-2 py-1">{j.status}</td>
              <td className="px-2 py-1">{j.attempts}/{j.maxAttempts}</td>
              <td className="px-2 py-1">
                <button onClick={() => retry(j)} className="text-blue-600 text-xs">
                  Retry
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-xs text-gray-500">Job runs detail not exposed via API yet.</div>
    </div>
  );
}
