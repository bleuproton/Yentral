// @ts-nocheck
import { NodeDefinition } from './types';

export const amazonListOrdersNode: NodeDefinition = {
  key: 'amazon.spapi.listOrders',
  displayName: 'Amazon SP-API List Orders',
  async run(ctx) {
    return { orders: [{ id: 'amz-order-1', status: 'SHIPPED' }] };
  },
};

export const bolListOrdersNode: NodeDefinition = {
  key: 'bol.listOrders',
  displayName: 'bol.com List Orders',
  async run(ctx) {
    return { orders: [{ id: 'bol-order-1', status: 'OPEN' }] };
  },
};
