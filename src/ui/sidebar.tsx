// @ts-nocheck
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Overview' },
  { href: '/catalog', label: 'Catalog' },
  { href: '/inventory', label: 'Inventory' },
  { href: '/orders', label: 'Orders' },
  { href: '/fulfillment', label: 'Fulfillment' },
  { href: '/returns', label: 'Returns' },
  { href: '/customers', label: 'Customers' },
  { href: '/invoices', label: 'Invoices' },
  { href: '/integrations', label: 'Integrations' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/tickets', label: 'Tickets' },
  { href: '/email', label: 'Email' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/ai-studio', label: 'AI Studio' },
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
