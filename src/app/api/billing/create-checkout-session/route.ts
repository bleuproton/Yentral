// @ts-nocheck
import { Role } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { hasRequiredRole } from "@/lib/rbac";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasRequiredRole(session.role, [Role.OWNER, Role.ADMIN])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tenantId = session.tenantId;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  let customerId = tenant.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: tenant.name,
      metadata: { tenantId: tenant.id, tenantSlug: tenant.slug }
    });
    customerId = customer.id;
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { stripeCustomerId: customer.id }
    });
  }

  const priceId = env.STRIPE_PRICE_ID;
  const sessionResult = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.NEXTAUTH_URL}/billing/success`,
    cancel_url: `${env.NEXTAUTH_URL}/billing/cancel`,
    subscription_data: {
      metadata: { tenantId: tenant.id, tenantSlug: tenant.slug }
    },
    metadata: { tenantId: tenant.id, tenantSlug: tenant.slug }
  });

  return NextResponse.json({ url: sessionResult.url });
}
