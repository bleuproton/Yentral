// @ts-nocheck
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/products', label: 'Products' },
  { href: '/inventory', label: 'Inventory' },
  { href: '/orders', label: 'Orders' },
  { href: '/fulfillment', label: 'Fulfillment' },
  { href: '/customers', label: 'Customers' },
  { href: '/invoices', label: 'Invoices' },
  { href: '/integrations', label: 'Integrations' },
  { href: '/support', label: 'Support' },
  { href: '/settings', label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 border-r min-h-screen p-4">
      <div className="mb-4 font-semibold">Yentral</div>
      <nav className="flex flex-col gap-2">
        {links.map((link) => {
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
