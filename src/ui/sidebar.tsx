// @ts-nocheck
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/dashboard', label: 'Overview', roles: ['OWNER', 'ADMIN', 'ACCOUNTANT'] },
  { href: '/dashboard/pim', label: 'PIM', roles: ['OWNER', 'ADMIN'] },
  { href: '/dashboard/inventory', label: 'Inventory', roles: ['OWNER', 'ADMIN'] },
  { href: '/dashboard/orders', label: 'Orders', roles: ['OWNER', 'ADMIN'] },
  { href: '/dashboard/fulfillment', label: 'Fulfillment', roles: ['OWNER', 'ADMIN'] },
  { href: '/dashboard/accounting', label: 'Accounting', roles: ['OWNER', 'ADMIN', 'ACCOUNTANT'] },
  { href: '/dashboard/reports', label: 'Reports', roles: ['OWNER', 'ADMIN', 'ACCOUNTANT'] },
  { href: '/dashboard/automations', label: 'Automations', roles: ['OWNER', 'ADMIN'] },
  { href: '/dashboard/integrations', label: 'Integrations', roles: ['OWNER', 'ADMIN'] },
  { href: '/dashboard/support', label: 'Support', roles: ['OWNER', 'ADMIN'] },
  { href: '/dashboard/settings', label: 'Settings', roles: ['OWNER', 'ADMIN'] },
];

async function fetchRole(): Promise<string | null> {
  try {
    const res = await fetch('/api/me');
    if (!res.ok) return null;
    const data = await res.json();
    return data?.activeTenant?.role ?? data?.memberships?.[0]?.role ?? null;
  } catch {
    return null;
  }
}

export function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetchRole().then(setRole).catch(() => {});
  }, []);

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
