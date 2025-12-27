export type CatalogProduct = {
  externalId: string;
  sku: string;
  name: string;
  raw?: any;
};

export type CatalogVariant = {
  externalId: string;
  sku: string;
  productExternalId: string;
  asin?: string;
  externalSku?: string;
  raw?: any;
};

export type OrderItem = {
  externalVariantId: string;
  qty: number;
  raw?: any;
};

export type ExternalOrder = {
  externalOrderId: string;
  items: OrderItem[];
  raw?: any;
};

export type ExternalLocation = {
  externalLocationId: string;
  name?: string;
};

export interface ConnectorRuntime {
  key: string;
  name: string;
  validateConfig(config: any): Promise<{ ok: boolean; error?: string }>;
  fetchCatalog(ctx: { config: any; cursor?: string }): Promise<{ products: CatalogProduct[]; variants: CatalogVariant[]; nextCursor?: string }>;
  fetchOrders(ctx: { config: any; cursor?: string }): Promise<{ orders: ExternalOrder[]; nextCursor?: string }>;
  fetchLocations(ctx: { config: any }): Promise<ExternalLocation[]>;
}
