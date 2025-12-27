import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Truck,
  Users,
  Receipt,
  Plug,
  LifeBuoy,
  BookOpen,
  Settings,
} from 'lucide-react';

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const mainNav: NavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Products', href: '/dashboard/products', icon: Package },
  { label: 'Inventory', href: '/dashboard/inventory', icon: Boxes },
  { label: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
  { label: 'Fulfillment', href: '/dashboard/fulfillment', icon: Truck },
  { label: 'Customers', href: '/dashboard/customers', icon: Users },
  { label: 'Invoices', href: '/dashboard/invoices', icon: Receipt },
  { label: 'Integrations', href: '/dashboard/integrations', icon: Plug },
  { label: 'Support', href: '/dashboard/support', icon: LifeBuoy },
  { label: 'Accounting', href: '/dashboard/accountant', icon: BookOpen },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];
