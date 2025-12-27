export function jsonOk(data: any, init?: ResponseInit) {
  return new Response(JSON.stringify({ ok: true, data }), {
    status: init?.status ?? 200,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
}

export function jsonError(error: { code: string; message: string; details?: any }, init?: ResponseInit) {
  return new Response(JSON.stringify({ ok: false, error }), {
    status: init?.status ?? 400,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
}

export const created = (data: any) => jsonOk(data, { status: 201 });
export const noContent = () => new Response(null, { status: 204 });
