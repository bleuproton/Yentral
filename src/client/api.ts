export async function apiClientFetch(input: RequestInfo, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});

  // Prefer tenant slug from localStorage
  if (typeof window !== 'undefined') {
    const slug = window.localStorage.getItem('tenantSlug');
    if (slug && !headers.has('x-tenant-slug')) {
      headers.set('x-tenant-slug', slug);
    }
  }

  // Fallback to tenantId cookie if needed
  if (!headers.has('x-tenant-id') && typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\\s*)tenantId=([^;]+)/);
    if (match) headers.set('x-tenant-id', decodeURIComponent(match[1]));
  }

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(input, { ...init, headers });
  const data = await safeJson(res);
  if (!res.ok) {
    const message = data?.error?.message || data?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
