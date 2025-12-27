// @ts-nocheck
import { Connector } from '../types';

const connector: Connector = {
  key: 'bigcommerce',
  name: 'BigCommerce',
  capabilities: {
    catalog: true,
    orders: true,
    inventory: true,
    priceUpdate: true,
    stockUpdate: true,
    regions: ['GLOBAL'],
  },
  async testConnection() {
    return { ok: true, message: 'Mock BigCommerce OK' };
  },
  async pullCatalogDelta(_config, cursor) {
    const next = cursor ? null : 'bc-cat-1';
    return {
      items: [
        { externalId: 'BC-P1', sku: 'BC-SKU-1', name: 'BigCommerce Product', variants: [{ externalId: 'BC-V1', sku: 'BC-SKU-1' }], raw: { cursor } },
      ],
      cursor: next,
      raw: { cursor, next },
    };
  },
  async pullOrdersDelta(_config, cursor) {
    const next = cursor ? null : 'bc-ord-1';
    return {
      items: [{ externalOrderId: 'BC-O-1', status: 'created', lines: [{ externalVariantId: 'BC-V1', qty: 1 }], raw: { cursor } }],
      cursor: next,
      raw: { cursor, next },
    };
  },
  async pullInventoryDelta(_config, cursor) {
    const next = cursor ? null : 'bc-inv-1';
    return {
      items: [{ externalVariantId: 'BC-V1', available: 4, raw: { cursor } }],
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
