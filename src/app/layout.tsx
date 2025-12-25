import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yentral Platform",
  description: "Multi-tenant commerce backend scaffold"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
