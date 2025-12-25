import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { env } from "./env";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        tenant: { label: "Tenant", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password || !credentials.tenant) {
          throw new Error("Email, password, and tenant are required");
        }

        const tenant = await prisma.tenant.findUnique({ where: { slug: credentials.tenant } });
        if (!tenant) {
          throw new Error("Invalid tenant");
        }

        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email,
            memberships: { some: { tenantId: tenant.id } }
          },
          include: { memberships: true }
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        const membership = user.memberships.find((m) => m.tenantId === tenant.id);
        if (!membership) {
          throw new Error("User is not a member of this tenant");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          role: membership.role
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tenantId = (user as any).tenantId;
        token.tenantSlug = (user as any).tenantSlug;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.tenantId = token.tenantId as string;
        session.tenantSlug = token.tenantSlug as string;
        session.role = token.role as any;
      }
      return session;
    }
  },
  pages: {
    signIn: "/"
  },
  secret: env.NEXTAUTH_SECRET
};

export function getServerAuthSession() {
  return getServerSession(authOptions);
}
