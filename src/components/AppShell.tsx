import React from "react";
import { NavItem } from "./NavItem";
import { TenantSwitcher } from "./TenantSwitcher";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/inventory", label: "Inventory" },
  { href: "/orders", label: "Orders" },
  { href: "/fulfillment/shipments", label: "Shipments" },
  { href: "/fulfillment/returns", label: "Returns" },
  { href: "/integrations", label: "Integrations" },
  { href: "/warehouses", label: "Warehouses" },
  { href: "/tickets", label: "Tickets" },
  { href: "/settings", label: "Settings" }
];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f9fafb", color: "#111827" }}>
      <aside style={{ width: 240, background: "#ffffff", borderRight: "1px solid #e5e7eb", padding: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <TenantSwitcher tenantName="Demo Tenant" />
        </div>
        <nav>
          {nav.map((item) => (
            <NavItem key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>
      </aside>
      <main style={{ flex: 1, padding: "24px 32px" }}>
        <header style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#6b7280" }}>Phase 5 Console</span>
        </header>
        {children}
      </main>
    </div>
  );
};
