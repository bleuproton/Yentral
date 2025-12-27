// @ts-nocheck
import { ConnectorRuntime } from '../types';
import { fetchJson } from '../httpClient';

function apiUrl(shopDomain: string, path: string) {
  return `https://${shopDomain}/admin/api/2023-10/${path}`;
}

async function shopifyRequest(shopDomain: string, token: string, path: string) {
  return fetchJson(apiUrl(shopDomain, path), {
    method: 'GET',
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json',
    },
  });
}

export const shopifyRuntime: ConnectorRuntime = {
  key: 'shopify',
  name: 'Shopify',
  async validateConfig(config: any) {
    if (!config?.shopDomain || !config?.adminAccessToken) return { ok: false, error: 'shopDomain and adminAccessToken required' };
    try {
      await shopifyRequest(config.shopDomain, config.adminAccessToken, 'shop.json');
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'validation failed' };
    }
  },
  async fetchCatalog({ config }) {
    const res = await shopifyRequest(config.shopDomain, config.adminAccessToken, 'products.json?limit=50');
    const products: any[] = [];
    const variants: any[] = [];
    for (const p of res.products || []) {
      products.push({ externalId: String(p.id), sku: p.handle || String(p.id), name: p.title, raw: p });
      for (const v of p.variants || []) {
        variants.push({
          externalId: String(v.id),
          sku: v.sku || `${p.handle}-${v.id}`,
          productExternalId: String(p.id),
          externalSku: v.sku || undefined,
          raw: v,
        });
      }
    }
    return { products, variants };
  },
  async fetchOrders({ config }) {
    const res = await shopifyRequest(config.shopDomain, config.adminAccessToken, 'orders.json?status=any&limit=50');
    const orders =
      (res.orders || []).map((o: any) => ({
        externalOrderId: String(o.id),
        items: (o.line_items || []).map((li: any) => ({ externalVariantId: String(li.variant_id), qty: li.quantity })),
        raw: o,
      })) || [];
    return { orders };
  },
  async fetchLocations({ config }) {
    const res = await shopifyRequest(config.shopDomain, config.adminAccessToken, 'locations.json');
    return (res.locations || []).map((l: any) => ({ externalLocationId: String(l.id), name: l.name }));
  },
};
