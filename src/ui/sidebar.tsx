import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/app/dashboard', label: 'Dashboard' },
  { href: '/app/products', label: 'Products' },
  { href: '/app/inventory', label: 'Inventory' },
  { href: '/app/orders', label: 'Orders' },
  { href: '/app/fulfillment/shipments', label: 'Shipments' },
  { href: '/app/fulfillment/returns', label: 'Returns' },
  { href: '/app/integrations', label: 'Integrations' },
  { href: '/app/warehouses', label: 'Warehouses' },
  { href: '/app/tickets', label: 'Tickets' },
  { href: '/app/settings', label: 'Settings' },
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
