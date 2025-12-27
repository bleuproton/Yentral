// @ts-nocheck
import { NodeDefinition } from './types';

export const emailSendNode: NodeDefinition = {
  key: 'email.send',
  displayName: 'Send Email',
  async run(ctx) {
    // stub: pretend sent
    return { sent: true, to: ctx.config?.to, subject: ctx.config?.subject };
  },
};
