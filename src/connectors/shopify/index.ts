// @ts-nocheck
import { Connector } from '../types';

const connector: Connector = {
  key: 'shopify',
  name: 'Shopify',
  capabilities: {
    catalog: true,
    orders: true,
    inventory: true,
    priceUpdate: true,
    stockUpdate: true,
    regions: ['GLOBAL'],
  },
  async testConnection() {
    return { ok: true, message: 'Mock Shopify OK' };
  },
  async pullCatalogDelta(_config, cursor) {
    const next = cursor ? null : 'shop-cat-1';
    return {
      items: [
        {
          externalId: 'SHOP-P1',
          sku: 'SHOP-SKU-1',
          name: 'Shopify Sample',
          variants: [{ externalId: 'SHOP-V1', sku: 'SHOP-SKU-1' }],
          raw: { cursor },
        },
      ],
      cursor: next,
      raw: { cursor, next },
    };
  },
  async pullOrdersDelta(_config, cursor) {
    const next = cursor ? null : 'shop-order-1';
    return {
      items: [
        { externalOrderId: 'SHOP-O-1', status: 'open', lines: [{ externalVariantId: 'SHOP-V1', qty: 1 }], raw: { cursor } },
      ],
      cursor: next,
      raw: { cursor, next },
    };
  },
  async pullInventoryDelta(_config, cursor) {
    const next = cursor ? null : 'shop-inv-1';
    return {
      items: [{ externalVariantId: 'SHOP-V1', available: 7, raw: { cursor } }],
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
