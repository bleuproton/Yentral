'use client';

import { useEffect, useState } from 'react';
import { apiClientFetch } from '@/client/api';

type Membership = { tenantId: string; tenant: { name: string; slug: string } };

export function TenantSwitcher() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiClientFetch('/api/tenants/me/memberships')
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

  const setTenant = async (tenantId: string, slug: string | undefined) => {
    if (typeof window !== 'undefined' && slug) {
      window.localStorage.setItem('tenantSlug', slug);
    }
    await apiClientFetch('/api/tenant/switch', {
      method: 'POST',
      body: JSON.stringify({ tenantId }),
    });
    window.location.reload();
  };

  return (
    <select
      className="border rounded px-2 py-1 text-sm"
      onChange={(e) => {
        const [tenantId, slug] = e.target.value.split('::');
        setTenant(tenantId, slug);
      }}
      defaultValue=""
      disabled={loading}
    >
      <option value="" disabled>
        {loading ? 'Loading...' : 'Select tenant'}
      </option>
      {memberships.map((m) => (
        <option key={m.tenantId} value={`${m.tenantId}::${m.tenant.slug ?? ''}`}>
          {m.tenant.name}
        </option>
      ))}
    </select>
  );
}
