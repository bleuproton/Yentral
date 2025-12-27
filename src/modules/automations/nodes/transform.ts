// @ts-nocheck
import { NodeDefinition } from './types';

export const transformNode: NodeDefinition = {
  key: 'transform.json',
  displayName: 'Transform JSON',
  async run(ctx) {
    const expr = ctx.config?.expression;
    if (!expr) return ctx.input;
    // extremely limited eval; do not expose in prod
    const fn = new Function('input', expr);
    return fn(ctx.input);
  },
};
