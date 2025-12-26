import type { Role } from "@prisma/client";
import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & { id: string };
    tenantId: string;
    tenantSlug: string;
    role: Role;
  }

  interface User extends DefaultUser {
    tenantId?: string;
    tenantSlug?: string;
    role?: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    tenantId: string;
    tenantSlug: string;
    role: Role;
  }
}
