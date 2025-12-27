// @ts-nocheck
import { Connector } from '../types';

const connector: Connector = {
  key: 'allegro',
  name: 'Allegro',
  capabilities: {
    catalog: true,
    orders: true,
    inventory: true,
    priceUpdate: true,
    stockUpdate: true,
    regions: ['EU'],
  },
  async testConnection() {
    return { ok: true, message: 'Mock Allegro OK' };
  },
  async pullCatalogDelta(_config, cursor) {
    const next = cursor ? null : 'allegro-cat-1';
    return {
      items: [
        { externalId: 'ALG-P1', sku: 'ALG-SKU-1', name: 'Allegro Product', variants: [{ externalId: 'ALG-V1', sku: 'ALG-SKU-1' }], raw: { cursor } },
      ],
      cursor: next,
      raw: { cursor, next },
    };
  },
  async pullOrdersDelta(_config, cursor) {
    const next = cursor ? null : 'allegro-ord-1';
    return {
      items: [{ externalOrderId: 'ALG-O-1', status: 'CREATED', lines: [{ externalVariantId: 'ALG-V1', qty: 1 }], raw: { cursor } }],
      cursor: next,
      raw: { cursor, next },
    };
  },
  async pullInventoryDelta(_config, cursor) {
    const next = cursor ? null : 'allegro-inv-1';
    return {
      items: [{ externalVariantId: 'ALG-V1', available: 6, raw: { cursor } }],
      cursor: next,
      raw: { cursor, next },
    };
  },
  async pushPriceUpdate() {
    return { ok: true, raw: { mocked: true } };
  },
  async pushStockUpdate() {
    return { ok: true, raw: { mocked: true } };
  },
};

export default connector;
