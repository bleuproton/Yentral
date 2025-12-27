'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/apiClient';

function getTenantId(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|;\s*)tenantId=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export default function ProductDetailPage({ params }: { params: { productId: string } }) {
  const tenantId = getTenantId();
  const [product, setProduct] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [form, setForm] = useState<any>({});
  const [variantForm, setVariantForm] = useState<any>({});
  const [tab, setTab] = useState<'details' | 'variants' | 'channel'>('details');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    apiFetch(`/api/tenants/${tenantId}/products/${params.productId}`).then((res) => {
      setProduct(res?.data);
      setForm({
        name: res?.data?.name ?? '',
        description: res?.data?.description ?? '',
        priceCents: res?.data?.priceCents ?? 0,
        currency: res?.data?.currency ?? 'EUR',
        status: res?.data?.status ?? '',
      });
    });
    apiFetch(`/api/tenants/${tenantId}/products/${params.productId}/variants`).then((res) => {
      setVariants(res?.data ?? []);
    });
  }, [tenantId, params.productId]);

  const save = async () => {
    if (!tenantId) return;
    await apiFetch(`/api/tenants/${tenantId}/products/${params.productId}`, {
      method: 'PATCH',
      body: JSON.stringify(form),
    });
    setMsg('Saved');
  };

  const addVariant = async () => {
    if (!tenantId) return;
    await apiFetch(`/api/tenants/${tenantId}/products/${params.productId}/variants`, {
      method: 'POST',
      body: JSON.stringify(variantForm),
    });
    const res = await apiFetch(`/api/tenants/${tenantId}/products/${params.productId}/variants`);
    setVariants(res?.data ?? []);
    setVariantForm({});
    setMsg('Variant added');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Product</h1>
        <div className="flex gap-2 text-sm">
          <button onClick={() => setTab('details')} className={tab === 'details' ? 'font-semibold' : ''}>
            Details
          </button>
          <button onClick={() => setTab('variants')} className={tab === 'variants' ? 'font-semibold' : ''}>
            Variants
          </button>
          <button onClick={() => setTab('channel')} className={tab === 'channel' ? 'font-semibold' : ''}>
            Channel mappings
          </button>
        </div>
      </div>
      {msg && <div className="text-green-700 text-sm">{msg}</div>}
      {tab === 'details' && (
        <div className="bg-white p-4 rounded border space-y-3 max-w-xl">
          <Input label="Name" value={form.name || ''} onChange={(v) => setForm({ ...form, name: v })} />
          <Input label="Description" value={form.description || ''} onChange={(v) => setForm({ ...form, description: v })} />
          <Input
            label="Price cents"
            type="number"
            value={form.priceCents || 0}
            onChange={(v) => setForm({ ...form, priceCents: Number(v) })}
          />
          <Input label="Currency" value={form.currency || 'EUR'} onChange={(v) => setForm({ ...form, currency: v })} />
          <Input label="Status" value={form.status || ''} onChange={(v) => setForm({ ...form, status: v })} />
          <button onClick={save} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
            Save
          </button>
        </div>
      )}
      {tab === 'variants' && (
        <div className="space-y-3">
          <div className="bg-white p-3 rounded border">
            <div className="font-semibold mb-2">Add variant</div>
            <div className="grid grid-cols-2 gap-2">
              <Input label="SKU" value={variantForm.sku || ''} onChange={(v) => setVariantForm({ ...variantForm, sku: v })} />
              <Input label="EAN" value={variantForm.ean || ''} onChange={(v) => setVariantForm({ ...variantForm, ean: v })} />
            </div>
            <button onClick={addVariant} className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm">
              Create variant
            </button>
          </div>
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-50 text-sm text-gray-700">
                <th className="px-3 py-2 text-left">SKU</th>
                <th className="px-3 py-2 text-left">EAN</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.id} className="border-t text-sm">
                  <td className="px-3 py-2">{v.sku}</td>
                  <td className="px-3 py-2">{v.ean || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === 'channel' && (
        <div className="bg-white p-4 rounded border text-sm text-gray-600">Channel mappings: use integration routes to link products/variants.</div>
      )}
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
    <label className="block text-sm">
      <span className="text-gray-700">{label}</span>
      <input
        className="mt-1 w-full border rounded px-2 py-1"
        value={value}
        type={type}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
