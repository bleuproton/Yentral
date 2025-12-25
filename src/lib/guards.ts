import { prisma } from "@/lib/prisma";

export async function assertTenantAccessForOrder(userId: string, tenantId: string, orderId: string) {
  const membership = await prisma.membership.findFirst({ where: { userId, tenantId } });
  if (!membership) throw new Error("Access denied");
  const order = await prisma.order.findFirst({ where: { id: orderId, tenantId } });
  if (!order) throw new Error("Order not found or access denied");
  return order;
}

export async function assertTenantAccessForProduct(userId: string, tenantId: string, productId: string) {
  const membership = await prisma.membership.findFirst({ where: { userId, tenantId } });
  if (!membership) throw new Error("Access denied");
  const product = await prisma.product.findFirst({ where: { id: productId, tenantId } });
  if (!product) throw new Error("Product not found or access denied");
  return product;
}
