import { ConnectorRuntime } from './types';
import { mockShopify } from './runtimes/mockShopify';
import { mockBol } from './runtimes/mockBol';
import { shopifyRuntime } from './runtimes/shopify';

// Map connector keys to runtimes. Add smoke aliases so smoke suites can reuse the mock runtime.
const registry: Record<string, ConnectorRuntime> = {
  'mock-shopify': mockShopify,
  'mock-bol': mockBol,
  shopify: shopifyRuntime,
  // smoke/test aliases
  'smoke-connector': mockShopify,
  'smoke-connector-7b': mockShopify,
};

export function getConnectorRuntime(key: string): ConnectorRuntime | undefined {
  return registry[key];
}

export function listConnectorRuntimes() {
  return Object.values(registry);
}
