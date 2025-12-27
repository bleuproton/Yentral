// @ts-nocheck
import { NodeDefinition } from './types';

export const httpRequestNode: NodeDefinition = {
  key: 'http.request',
  displayName: 'HTTP Request',
  async run(ctx) {
    const { url, method = 'GET', headers = {}, body } = ctx.config || {};
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
    return { status: res.status, body: json };
  },
};
