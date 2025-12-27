// @ts-nocheck

export type ConnectorKey = 'amazon_spapi' | 'bol' | 'shopify' | 'bigcommerce' | 'allegro';

export type SyncCursor = { cursor?: string | null; raw?: any };

export type CatalogItem = {
  externalId: string;
  sku: string;
  name: string;
  variants: { externalId: string; sku: string; asin?: string; ean?: string }[];
  raw?: any;
};

export type OrderItem = {
  externalOrderId: string;
  status?: string;
  lines: { externalVariantId: string; qty: number }[];
  raw?: any;
};

export type InventoryItem = {
  externalVariantId: string;
  available: number;
  raw?: any;
};

export type ConnectorCapabilities = {
  catalog: boolean;
  orders: boolean;
  inventory: boolean;
  priceUpdate: boolean;
  stockUpdate: boolean;
  regions?: string[];
};

export interface Connector {
  key: ConnectorKey;
  name: string;
  capabilities: ConnectorCapabilities;
  testConnection(config: any): Promise<{ ok: boolean; message?: string; raw?: any }>;
  pullCatalogDelta(config: any, cursor?: string | null): Promise<{ items: CatalogItem[]; cursor?: string | null; raw?: any }>;
  pullOrdersDelta(config: any, cursor?: string | null): Promise<{ items: OrderItem[]; cursor?: string | null; raw?: any }>;
  pullInventoryDelta(config: any, cursor?: string | null): Promise<{ items: InventoryItem[]; cursor?: string | null; raw?: any }>;
  pushPriceUpdate?(config: any, updates: any[]): Promise<{ ok: boolean; raw?: any }>;
  pushStockUpdate?(config: any, updates: any[]): Promise<{ ok: boolean; raw?: any }>;
}
