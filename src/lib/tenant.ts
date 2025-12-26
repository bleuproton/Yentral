import type { NextRequest } from "next/server";
import { prisma } from "./prisma";

export function extractTenantSlug(req: NextRequest): string | null {
  const headerSlug = req.headers.get("x-tenant-id");
  if (headerSlug) return headerSlug;

  const searchSlug = req.nextUrl.searchParams.get("tenant");
  if (searchSlug) return searchSlug;

  const host = req.headers.get("host");
  if (!host) return null;

  const [maybeSubdomain] = host.split(".");
  if (maybeSubdomain && maybeSubdomain !== "localhost") {
    return maybeSubdomain;
  }

  return null;
}

export async function resolveTenant(req: NextRequest) {
  const slug = extractTenantSlug(req);
  if (!slug) return null;
  return prisma.tenant.findUnique({ where: { slug } });
}

export async function requireTenant(req: NextRequest) {
  const tenant = await resolveTenant(req);
  if (!tenant) {
    throw new Error("Tenant not found or missing. Provide x-tenant-id header or tenant query param.");
  }
  return tenant;
}
