import { AsyncLocalStorage } from 'async_hooks';
import { RequestContext } from './context';

const als = new AsyncLocalStorage<RequestContext>();

export function withContext<T>(ctx: RequestContext, fn: () => Promise<T>): Promise<T> {
  return als.run(ctx, fn);
}

export function getContext(): RequestContext | null {
  return als.getStore() ?? null;
}

export { als };
