// @ts-nocheck
import { NodeDefinition } from './types';

export const scheduleTriggerNode: NodeDefinition = {
  key: 'schedule.trigger',
  displayName: 'Schedule Trigger',
  async run(ctx) {
    return ctx.input ?? {};
  },
};
