import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerAuthSession } from '@/lib/auth';

async function setTenant(tenantId: string) {
  'use server';
  cookies().set('tenantId', tenantId, { path: '/', httpOnly: false });
  redirect('/dashboard');
}

export default async function SelectTenantPage() {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  const devBypass = process.env.NODE_ENV === 'development' && process.env.DEV_BYPASS_AUTH === '1';
  let memberships: any[] = [];
  if (userId) {
    memberships = await prisma.membership.findMany({ where: { userId }, include: { tenant: true } });
  } else if (devBypass) {
    memberships = await prisma.membership.findMany({ include: { tenant: true } });
  }

  if (memberships.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-lg font-semibold">No tenants available</div>
          <div className="text-sm text-gray-600">Please contact an administrator to be added.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow max-w-sm w-full space-y-4">
        <h1 className="text-xl font-semibold">Select Tenant</h1>
        <form action={setTenant} className="space-y-3">
          <select
            name="tenantId"
            className="w-full border rounded px-3 py-2 text-sm"
            defaultValue={memberships[0]?.tenantId}
          >
            {memberships.map((m) => (
              <option key={m.tenantId} value={m.tenantId}>
                {m.tenant.name}
              </option>
            ))}
          </select>
          <button type="submit" className="w-full bg-blue-600 text-white rounded px-3 py-2 text-sm hover:bg-blue-700">
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
