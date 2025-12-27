import prisma from '@/lib/prisma';
import { NotFoundError } from '../http/errors';

export async function resolveTenantIdBySlug(slug: string): Promise<string> {
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) throw new NotFoundError('Tenant not found');
  return tenant.id;
}
