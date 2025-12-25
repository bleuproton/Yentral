import { PrismaClient, Role, ProductStatus, OrderStatus, TicketStatus, JobStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      slug: "demo",
      name: "Demo Store"
    }
  });

  const passwordHash = bcrypt.hashSync("changeme123", 10);

  const user = await prisma.user.upsert({
    where: { email: "admin@yentral.test" },
    update: { password: passwordHash, name: "Demo Admin" },
    create: {
      email: "admin@yentral.test",
      name: "Demo Admin",
      password: passwordHash
    }
  });

  await prisma.membership.upsert({
    where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
    update: { role: Role.OWNER },
    create: {
      userId: user.id,
      tenantId: tenant.id,
      role: Role.OWNER
    }
  });

  const product = await prisma.product.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "tee" } },
    update: {
      status: ProductStatus.ACTIVE,
      priceCents: 2500,
      description: "Soft cotton tee"
    },
    create: {
      tenantId: tenant.id,
      slug: "tee",
      name: "Yentral Tee",
      description: "Soft cotton tee",
      priceCents: 2500,
      currency: "USD",
      status: ProductStatus.ACTIVE
    }
  });

  await prisma.inventoryItem.upsert({
    where: { id: `${product.id}-inventory` },
    update: { quantity: 100, reserved: 0 },
    create: {
      id: `${product.id}-inventory`,
      tenantId: tenant.id,
      productId: product.id,
      location: "main",
      quantity: 100,
      reserved: 0
    }
  });

  const order = await prisma.order.upsert({
    where: { tenantId_orderNumber: { tenantId: tenant.id, orderNumber: 1001 } },
    update: { status: OrderStatus.PAID },
    create: {
      tenantId: tenant.id,
      userId: user.id,
      orderNumber: 1001,
      status: OrderStatus.PAID,
      currency: "USD",
      totalCents: 2500
    }
  });

  await prisma.orderLine.upsert({
    where: { id: `${order.id}-line1` },
    update: {},
    create: {
      id: `${order.id}-line1`,
      orderId: order.id,
      productId: product.id,
      quantity: 1,
      unitCents: 2500,
      totalCents: 2500
    }
  });

  const plugin = await prisma.plugin.upsert({
    where: { key: "billing" },
    update: {
      latestVersion: "1.0.0",
      channel: "payments",
      homepage: "https://example.com/plugins/billing",
      isChannelPlugin: true
    },
    create: {
      key: "billing",
      name: "Billing",
      description: "Core billing plugin",
      latestVersion: "1.0.0",
      channel: "payments",
      homepage: "https://example.com/plugins/billing",
      isChannelPlugin: true,
      configSchema: { stripePriceId: "string", sendReceiptEmail: "boolean" }
    }
  });

  await prisma.pluginInstallation.upsert({
    where: { tenantId_pluginId: { tenantId: tenant.id, pluginId: plugin.id } },
    update: { enabled: true, version: "1.0.0" },
    create: {
      tenantId: tenant.id,
      pluginId: plugin.id,
      version: "1.0.0",
      enabled: true
    }
  });

  await prisma.job.create({
    data: {
      tenantId: tenant.id,
      type: "demo.welcome-email",
      status: JobStatus.PENDING,
      payload: { email: user.email }
    }
  });

  const ticket = await prisma.ticket.create({
    data: {
      tenantId: tenant.id,
      authorId: user.id,
      assigneeId: user.id,
      title: "Welcome to Yentral",
      description: "Your tenant is ready. This is a sample ticket.",
      status: TicketStatus.IN_PROGRESS,
      priority: 2,
      slaDueAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
    }
  });

  await prisma.jobRun.create({
    data: {
      tenantId: tenant.id,
      jobName: "seed.demo",
      status: JobStatus.COMPLETED,
      attempts: 1,
      maxAttempts: 1,
      meta: { ticketId: ticket.id }
    }
  });

  console.log("Seed complete. Login with admin@yentral.test / changeme123 (tenant: demo)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
