// @ts-nocheck
import { Connector } from '../types';

const connector: Connector = {
  key: 'bol',
  name: 'bol.com Seller API',
  capabilities: {
    catalog: true,
    orders: true,
    inventory: true,
    priceUpdate: true,
    stockUpdate: true,
    regions: ['EU'],
  },
  async testConnection() {
    return { ok: true, message: 'Mock bol OK' };
  },
  async pullCatalogDelta(_config, cursor) {
    const next = cursor ? null : 'bol-cat-1';
    return {
      items: [
        {
          externalId: 'BOL-P1',
          sku: 'BOL-SKU-1',
          name: 'Bol Sample Product',
          variants: [{ externalId: 'BOL-V1', sku: 'BOL-SKU-1', ean: '1234567890123' }],
          raw: { cursor },
        },
      ],
      cursor: next,
      raw: { cursor, next },
    };
  },
  async pullOrdersDelta(_config, cursor) {
    const next = cursor ? null : 'bol-ord-1';
    return {
      items: [
        { externalOrderId: 'BOL-O-1', status: 'CREATED', lines: [{ externalVariantId: 'BOL-V1', qty: 2 }], raw: { cursor } },
      ],
      cursor: next,
      raw: { cursor, next },
    };
  },
  async pullInventoryDelta(_config, cursor) {
    const next = cursor ? null : 'bol-inv-1';
    return {
      items: [{ externalVariantId: 'BOL-V1', available: 3, raw: { cursor } }],
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
