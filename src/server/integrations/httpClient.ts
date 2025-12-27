// @ts-nocheck
const buckets = new Map<string, { tokens: number; last: number }>();

function takeToken(key: string, ratePerSec = 5) {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { tokens: ratePerSec, last: now };
  const elapsed = (now - bucket.last) / 1000;
  bucket.tokens = Math.min(ratePerSec, bucket.tokens + elapsed * ratePerSec);
  if (bucket.tokens < 1) {
    const waitMs = ((1 - bucket.tokens) / ratePerSec) * 1000;
    return new Promise((res) => setTimeout(res, waitMs)).then(() => takeToken(key, ratePerSec));
  }
  bucket.tokens -= 1;
  bucket.last = now;
  buckets.set(key, bucket);
  return Promise.resolve();
}

export async function fetchJson(
  url: string,
  init: RequestInit = {},
  opts: { connectionId?: string; tenantId?: string; correlationId?: string } = {}
) {
  const key = opts.connectionId || 'global';
  await takeToken(key);
  const headers = new Headers(init.headers || {});
  if (!headers.has('content-type')) headers.set('content-type', 'application/json');
  const timeoutMs = Number(process.env.CONNECTOR_HTTP_TIMEOUT_MS || 10000);
  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    attempt++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, headers, signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) {
        if (res.status === 429 || res.status >= 500) {
          const retryAfter = Number(res.headers.get('retry-after'));
          const delay = retryAfter ? retryAfter * 1000 : Math.pow(2, attempt) * 500;
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const json = await res.json();
      return json;
    } catch (err) {
      clearTimeout(timer);
      if (attempt >= maxAttempts) throw err;
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 500));
    }
  }
}
