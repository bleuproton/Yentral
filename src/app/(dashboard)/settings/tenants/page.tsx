import { getServerAuthSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function TenantsSettingsPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) redirect('/');
  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id },
    include: { tenant: true },
  });
  const current = cookies().get('tenantId')?.value;
  async function setCookie(tenantId: string) {
    'use server';
    const cookieStore = cookies();
    cookieStore.set('tenantId', tenantId, { path: '/', httpOnly: false });
    redirect('/app/dashboard');
  }
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Tenants</h1>
      <p className="text-sm text-gray-600 mb-4">Select your active tenant.</p>
      <ul className="space-y-2">
        {memberships.map((m) => (
          <li key={m.tenantId} className="flex items-center justify-between bg-white p-3 rounded border">
            <div>
              <div className="font-medium">{m.tenant.name}</div>
              <div className="text-xs text-gray-500">Slug: {m.tenant.slug}</div>
            </div>
            <form action={setCookie.bind(null, m.tenantId)}>
              <button
                type="submit"
                className={`px-3 py-1 rounded text-sm ${
                  current === m.tenantId ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white'
                }`}
              >
                {current === m.tenantId ? 'Active' : 'Select'}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
