// @ts-nocheck
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

type Props = { href: string; label: string };

export const NavItem: React.FC<Props> = ({ href, label }) => {
  const pathname = usePathname();
  const active = pathname.startsWith(href);
  return (
    <Link
      href={href}
      style={{
        display: "block",
        padding: "8px 12px",
        borderRadius: 6,
        background: active ? "#e5e7eb" : "transparent",
        color: active ? "#111827" : "#374151",
        textDecoration: "none",
        fontWeight: active ? 600 : 500,
        marginBottom: 6
      }}
    >
      {label}
    </Link>
  );
};
