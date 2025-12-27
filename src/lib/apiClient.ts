export async function apiFetch(input: RequestInfo, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  // attempt to read tenantId cookie on client
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)tenantId=([^;]+)/);
    if (match && !headers.has('x-tenant-id')) {
      headers.set('x-tenant-id', decodeURIComponent(match[1]));
    }
  }
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json');
  const res = await fetch(input, { ...init, headers });
  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(err?.error?.message || `Request failed (${res.status})`);
  }
  return safeJson(res);
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
