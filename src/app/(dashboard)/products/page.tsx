'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiClient';

type Product = { id: string; sku: string; name: string; status?: string; priceCents?: number; currency?: string };

function getTenantId(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|;\s*)tenantId=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tenantId = getTenantId();

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    apiFetch(`/api/tenants/${tenantId}/products`)
      .then((res) => setItems(res?.data ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [tenantId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Products</h1>
        <Link href="/products" className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
          New product
        </Link>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-50 text-sm text-gray-700">
              <th className="px-3 py-2 text-left">SKU</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t hover:bg-gray-50 text-sm">
                <td className="px-3 py-2">
                  <Link className="text-blue-600" href={`/products/${p.id}`}>
                    {p.sku}
                  </Link>
                </td>
                <td className="px-3 py-2">{p.name}</td>
                <td className="px-3 py-2">{p.status ?? '-'}</td>
                <td className="px-3 py-2">
                  {p.priceCents ? `${(p.priceCents / 100).toFixed(2)} ${p.currency ?? 'EUR'}` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
