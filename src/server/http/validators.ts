export async function parseJson<T = any>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch (err: any) {
    throw new Error('Invalid JSON');
  }
}

export function parsePagination(searchParams: URLSearchParams) {
  const limitRaw = searchParams.get('limit');
  const cursor = searchParams.get('cursor') ?? undefined;
  const limit = limitRaw ? Math.min(100, Math.max(1, Number(limitRaw))) : 50;
  return { limit, cursor };
}
