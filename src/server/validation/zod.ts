import { z, ZodSchema } from 'zod';
import { BadRequestError } from '../http/errors';

export async function parseJson<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  let body: any;
  try {
    body = await req.json();
  } catch {
    throw new BadRequestError('Invalid JSON');
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.message);
  }
  return parsed.data;
}

export function parseQuery<T>(url: URL, schema: ZodSchema<T>): T {
  const obj: Record<string, any> = {};
  url.searchParams.forEach((v, k) => {
    obj[k] = v;
  });
  const parsed = schema.safeParse(obj);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.message);
  }
  return parsed.data;
}
