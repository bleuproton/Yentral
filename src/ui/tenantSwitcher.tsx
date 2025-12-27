'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiClient';

type Membership = { tenantId: string; tenant: { name: string; slug: string } };

export function TenantSwitcher() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiFetch('/api/tenants/me/memberships')
      .then((res) => {
        if (!mounted) return;
        setMemberships(res?.data ?? []);
      })
      .catch(() => {})
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const setTenant = async (tenantId: string) => {
    await apiFetch('/api/tenant/switch', {
      method: 'POST',
      body: JSON.stringify({ tenantId }),
    });
    window.location.reload();
  };

  return (
    <select
      className="border rounded px-2 py-1 text-sm"
      onChange={(e) => setTenant(e.target.value)}
      defaultValue=""
      disabled={loading}
    >
      <option value="" disabled>
        {loading ? 'Loading...' : 'Select tenant'}
      </option>
      {memberships.map((m) => (
        <option key={m.tenantId} value={m.tenantId}>
          {m.tenant.name}
        </option>
      ))}
    </select>
  );
}
