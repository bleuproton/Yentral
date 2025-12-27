import { ConnectorRuntime } from '../types';

export const mockBol: ConnectorRuntime = {
  key: 'mock-bol',
  name: 'Mock bol.com',
  async validateConfig() {
    return { ok: true };
  },
  async fetchCatalog() {
    const products = [{ externalId: 'bol-p1', sku: 'BOL-P1', name: 'Bol Product 1' }];
    const variants = [{ externalId: 'bol-v1', sku: 'BOL-P1-V1', productExternalId: 'bol-p1', externalSku: 'BOL-P1-V1' }];
    return { products, variants };
  },
  async fetchOrders() {
    return { orders: [{ externalOrderId: 'bol-o1', items: [{ externalVariantId: 'bol-v1', qty: 1 }] }] };
  },
  async fetchLocations() {
    return [{ externalLocationId: 'bol-loc-1', name: 'Bol Location' }];
  },
};
