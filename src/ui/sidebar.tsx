// @ts-nocheck
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type RoleKey = 'OWNER' | 'ADMIN' | 'ACCOUNTANT_ADMIN' | 'ACCOUNTANT_READONLY' | 'MEMBER' | 'ACCOUNTANT';

const links = [
  { href: '/dashboard', label: 'Overview', roles: ['OWNER', 'ADMIN', 'ACCOUNTANT_ADMIN', 'ACCOUNTANT_READONLY', 'MEMBER'] },
  { href: '/products', label: 'Products', roles: ['OWNER', 'ADMIN'] },
  { href: '/inventory', label: 'Inventory', roles: ['OWNER', 'ADMIN'] },
  { href: '/orders', label: 'Orders', roles: ['OWNER', 'ADMIN'] },
  { href: '/fulfillment', label: 'Fulfillment', roles: ['OWNER', 'ADMIN'] },
  { href: '/customers', label: 'Customers', roles: ['OWNER', 'ADMIN'] },
  { href: '/invoices', label: 'Invoices', roles: ['OWNER', 'ADMIN', 'ACCOUNTANT_ADMIN', 'ACCOUNTANT_READONLY'] },
  { href: '/integrations', label: 'Integrations', roles: ['OWNER', 'ADMIN'] },
  { href: '/support', label: 'Support', roles: ['OWNER', 'ADMIN', 'ACCOUNTANT_ADMIN', 'ACCOUNTANT_READONLY'] },
  { href: '/accountant', label: 'Accountant', roles: ['OWNER', 'ADMIN', 'ACCOUNTANT_ADMIN', 'ACCOUNTANT_READONLY'] },
  { href: '/settings', label: 'Settings', roles: ['OWNER', 'ADMIN'] },
];

async function fetchRole(): Promise<RoleKey | null> {
  try {
    const res = await fetch('/api/me');
    if (!res.ok) return null;
    const data = await res.json();
    return data?.activeTenant?.role ?? data?.memberships?.[0]?.role ?? null;
  } catch {
    return null;
  }
}

export function Sidebar({ role: roleProp }: { role?: RoleKey }) {
  const pathname = usePathname();
  const [role, setRole] = useState<RoleKey | null>(roleProp ?? null);

  useEffect(() => {
    if (roleProp) return;
    fetchRole().then(setRole).catch(() => {});
  }, [roleProp]);

  return (
    <aside className="w-56 border-r min-h-screen p-4">
      <div className="mb-4 font-semibold">Yentral</div>
      <nav className="flex flex-col gap-2">
        {links.map((link) => {
          if (role && !link.roles?.includes(role as any)) return null;
          const active = pathname?.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-2 py-1 rounded ${active ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
