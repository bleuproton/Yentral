import type { Metadata } from "next";
import "./globals.css";
import { ErrorFilter } from "@/components/ErrorFilter";

export const metadata: Metadata = {
  title: "Yentral Platform",
  description: "Multi-tenant commerce backend scaffold"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ErrorFilter />
        {children}
      </body>
    </html>
  );
}
