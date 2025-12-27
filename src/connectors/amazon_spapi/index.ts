// @ts-nocheck
import { Connector } from '../types';

const connector: Connector = {
  key: 'amazon_spapi',
  name: 'Amazon SP-API',
  capabilities: {
    catalog: true,
    orders: true,
    inventory: true,
    priceUpdate: true,
    stockUpdate: true,
    regions: ['EU', 'US'],
  },
  async testConnection() {
    return { ok: true, message: 'Mock Amazon OK' };
  },
  async pullCatalogDelta(_config, cursor) {
    const next = cursor ? null : 'amz-cursor-1';
    return {
      items: [
        {
          externalId: 'AMZ-P1',
          sku: 'AMZ-SKU-1',
          name: 'Amazon Sample Product',
          variants: [{ externalId: 'AMZ-V1', sku: 'AMZ-SKU-1', asin: 'B000TEST' }],
          raw: { cursor },
        },
      ],
      cursor: next,
      raw: { cursor, next },
    };
  },
  async pullOrdersDelta(_config, cursor) {
    const next = cursor ? null : 'amz-order-cursor-1';
    return {
      items: [
        {
          externalOrderId: 'AMZ-O-1',
          status: 'Created',
          lines: [{ externalVariantId: 'AMZ-V1', qty: 1 }],
          raw: { cursor },
        },
      ],
      cursor: next,
      raw: { cursor, next },
    };
  },
  async pullInventoryDelta(_config, cursor) {
    const next = cursor ? null : 'amz-inv-cursor-1';
    return {
      items: [{ externalVariantId: 'AMZ-V1', available: 5, raw: { cursor } }],
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
