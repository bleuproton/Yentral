// @ts-nocheck
import { OrderStatus } from "@prisma/client";
import { OrderRepository } from "@/_legacy/repositories/orderRepository";
import { InventoryService } from "./inventoryService";

export class OrderService {
  constructor(private repo = new OrderRepository(), private inventory = new InventoryService()) {}

  async createOrder(tenantId: string, input: { number: number; currency: string; customerEmail?: string }) {
    const order = await this.repo.create({
      tenantId,
      number: input.number,
      status: OrderStatus.PENDING,
      currency: input.currency,
      totalCents: 0,
      customerEmail: input.customerEmail
    });
    return { order, events: [{ type: "order.created", tenantId, orderId: order.id }] };
  }

  async addLine(
    tenantId: string,
    orderId: string,
    line: { variantId: string; quantity: number; unitCents: number }
  ) {
    if (line.quantity <= 0) throw new Error("Quantity must be positive");
    const order = await this.repo.getById(tenantId, orderId);
    if (!order) throw new Error("Order not found");

    const totalCents = line.quantity * line.unitCents;
    const added = await this.repo.addLine({
      tenantId,
      orderId,
      variantId: line.variantId,
      quantity: line.quantity,
      unitCents: line.unitCents,
      totalCents
    });

    await this.repo.update(orderId, { totalCents: order.totalCents + totalCents });

    return { line: added, events: [{ type: "order.line_added", tenantId, orderId, variantId: line.variantId }] };
  }

  async confirm(tenantId: string, orderId: string, warehouseId: string) {
    const order = await this.repo.getById(tenantId, orderId);
    if (!order) throw new Error("Order not found");

    const lines = await this.repo.listLines(tenantId, orderId);
    for (const l of lines) {
      await this.inventory.reserveStock(tenantId, {
        warehouseId,
        variantId: l.variantId,
        orderLineId: l.id,
        quantity: l.quantity
      });
    }

    await this.repo.update(orderId, { status: OrderStatus.PAID });

    return { events: [{ type: "order.confirmed", tenantId, orderId }] };
  }
}
