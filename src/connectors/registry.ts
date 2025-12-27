// @ts-nocheck
import { ConnectorKey, Connector } from './types';
import amazon from './amazon_spapi';
import bol from './bol';
import shopify from './shopify';
import bigcommerce from './bigcommerce';
import allegro from './allegro';

const connectors: Record<ConnectorKey, Connector> = {
  amazon_spapi: amazon,
  bol,
  shopify,
  bigcommerce,
  allegro,
};

export function getConnector(key: ConnectorKey): Connector {
  const c = connectors[key];
  if (!c) throw new Error(`Connector not found: ${key}`);
  return c;
}

export function listConnectors() {
  return Object.values(connectors).map((c) => ({
    key: c.key,
    name: c.name,
    capabilities: c.capabilities,
  }));
}
