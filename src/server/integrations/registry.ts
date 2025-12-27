import { ConnectorRuntime } from './types';
import { mockShopify } from './runtimes/mockShopify';
import { mockBol } from './runtimes/mockBol';
import { shopifyRuntime } from './runtimes/shopify';

const registry: Record<string, ConnectorRuntime> = {
  'mock-shopify': mockShopify,
  'mock-bol': mockBol,
  shopify: shopifyRuntime,
};

export function getConnectorRuntime(key: string): ConnectorRuntime | undefined {
  return registry[key];
}

export function listConnectorRuntimes() {
  return Object.values(registry);
}
