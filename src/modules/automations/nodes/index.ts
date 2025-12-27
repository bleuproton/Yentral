import { NodeDefinition } from './types';
import { httpRequestNode } from './httpRequest';
import { transformNode } from './transform';
import { webhookTriggerNode } from './webhookTrigger';
import { scheduleTriggerNode } from './scheduleTrigger';
import { emailSendNode } from './emailSend';
import { amazonListOrdersNode, bolListOrdersNode } from './connectorOrders';

const registry: Record<string, NodeDefinition> = {};
[httpRequestNode, transformNode, webhookTriggerNode, scheduleTriggerNode, emailSendNode, amazonListOrdersNode, bolListOrdersNode].forEach(
  (node) => {
    registry[node.key] = node;
  }
);

export function getNode(key: string): NodeDefinition | undefined {
  return registry[key];
}

export function listNodes() {
  return Object.values(registry);
}
