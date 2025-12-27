import { ConnectorRuntime } from '../types';

function buildId(seed: string) {
  return `mock-${seed}`;
}

export const mockShopify: ConnectorRuntime = {
  key: 'mock-shopify',
  name: 'Mock Shopify',
  async validateConfig() {
    return { ok: true };
  },
  async fetchCatalog() {
    const products = [
      { externalId: buildId('p1'), sku: 'MS-P1', name: 'Mock Product 1', raw: { source: 'mock' } },
      { externalId: buildId('p2'), sku: 'MS-P2', name: 'Mock Product 2', raw: { source: 'mock' } },
    ];
    const variants = [
      { externalId: buildId('v1'), sku: 'MS-P1-V1', productExternalId: buildId('p1'), externalSku: 'MS-P1-V1' },
      { externalId: buildId('v2'), sku: 'MS-P2-V1', productExternalId: buildId('p2'), externalSku: 'MS-P2-V1' },
    ];
    return { products, variants };
  },
  async fetchOrders() {
    const orders = [
      {
        externalOrderId: buildId('o1'),
        items: [
          { externalVariantId: buildId('v1'), qty: 1 },
          { externalVariantId: buildId('v2'), qty: 2 },
        ],
        raw: { source: 'mock' },
      },
    ];
    return { orders };
  },
  async fetchLocations() {
    return [
      { externalLocationId: buildId('loc1'), name: 'Mock Location 1' },
      { externalLocationId: buildId('loc2'), name: 'Mock Location 2' },
    ];
  },
};
