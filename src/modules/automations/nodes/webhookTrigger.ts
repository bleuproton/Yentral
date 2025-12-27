// @ts-nocheck
import { NodeDefinition } from './types';

export const webhookTriggerNode: NodeDefinition = {
  key: 'webhook.trigger',
  displayName: 'Webhook Trigger',
  async run(ctx) {
    return ctx.input ?? {};
  },
};
