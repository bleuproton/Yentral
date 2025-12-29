/**
 * Voorbeeld: Enhanced Order Service met Event-Driven Architecture
 * 
 * Deze service laat zien hoe modules met elkaar integreren via events
 */

import prisma from '@/lib/prisma';
import { eventBus, createEvent, EventTypes } from '@/shared/events/event-bus';
import type { Order, OrderLine } from '@prisma/client';

interface CreateOrderInput {
  tenantId: string;
  customerId?: string;
  customerEmail?: string;
  lines: Array<{
    productId: string;
    variantId: string;
    quantity: number;
    unitCents: number;
  }>;
  currency?: string;
  notes?: string;
}

interface OrderWithLines extends Order {
  lines: OrderLine[];
}

export class EnhancedOrderService {
  /**
   * Maak een nieuwe order met volledige integratie
   */
  async createOrder(input: CreateOrderInput): Promise<OrderWithLines> {
    const { tenantId, customerId, customerEmail, lines, currency = 'EUR', notes } = input;

    // Validate tenant access
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error('TENANT_NOT_FOUND');

    // 1. Validate products exist and are available
    const productIds = lines.map(l => l.productId);
    const products = await prisma.product.findMany({
      where: { tenantId, id: { in: productIds }, status: 'ACTIVE' }
    });
    
    if (products.length !== productIds.length) {
      throw new Error('SOME_PRODUCTS_NOT_FOUND');
    }

    // 2. Check inventory availability (via event system zou ook kunnen)
    for (const line of lines) {
      const stock = await prisma.stockSnapshot.findFirst({
        where: { tenantId, variantId: line.variantId }
      });
      
      if (!stock || stock.available < line.quantity) {
        throw new Error(`INSUFFICIENT_STOCK:${line.variantId}`);
      }
    }

    // 3. Calculate totals
    const totalCents = lines.reduce((sum, line) => 
      sum + (line.unitCents * line.quantity), 0
    );

    // 4. Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Generate order number
      const lastOrder = await tx.order.findFirst({
        where: { tenantId },
        orderBy: { orderNumber: 'desc' }
      });
      const orderNumber = (lastOrder?.orderNumber || 0) + 1;

      // Create order
      const newOrder = await tx.order.create({
        data: {
          tenantId,
          orderNumber,
          customerId,
          customerEmail,
          currency,
          totalCents,
          status: 'PENDING',
          notes
        }
      });

      // Create order lines
      const orderLines = await Promise.all(
        lines.map(line =>
          tx.orderLine.create({
            data: {
              tenantId,
              orderId: newOrder.id,
              productId: line.productId,
              variantId: line.variantId,
              quantity: line.quantity,
              unitCents: line.unitCents,
              totalCents: line.unitCents * line.quantity
            }
          })
        )
      );

      // Audit log
      await tx.auditEvent.create({
        data: {
          tenantId,
          action: 'ORDER_CREATED',
          resourceType: 'Order',
          resourceId: newOrder.id,
          details: { orderNumber, totalCents, lineCount: lines.length }
        }
      });

      return { ...newOrder, lines: orderLines };
    });

    // 5. Publish event - andere modules kunnen hier op reageren
    await eventBus.publish(createEvent(
      EventTypes.ORDER_CREATED,
      tenantId,
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId,
        totalCents,
        lineCount: lines.length
      }
    ));

    return order;
  }

  /**
   * Bevestig order - reserved inventory en trigger fulfillment
   */
  async confirmOrder(tenantId: string, orderId: string, warehouseId: string): Promise<Order> {
    // 1. Get order with lines
    const order = await prisma.order.findFirst({
      where: { tenantId, id: orderId },
      include: { lines: true }
    });

    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (order.status !== 'PENDING') throw new Error('ORDER_NOT_PENDING');

    // 2. Reserve inventory voor elke line
    // Dit triggert inventory.reserve() via een event handler
    const reservations = await Promise.all(
      order.lines.map(line =>
        eventBus.publish(createEvent(
          EventTypes.STOCK_RESERVED,
          tenantId,
          {
            orderId: order.id,
            orderLineId: line.id,
            variantId: line.variantId,
            quantity: line.quantity,
            warehouseId
          }
        ))
      )
    );

    // 3. Update order status
    const updatedOrder = await prisma.order.update({
      where: { tenantId_id: { tenantId, id: orderId } },
      data: { status: 'CONFIRMED' }
    });

    // 4. Publish event
    await eventBus.publish(createEvent(
      EventTypes.ORDER_CONFIRMED,
      tenantId,
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        warehouseId
      }
    ));

    return updatedOrder;
  }

  /**
   * Mark order als paid - trigger invoice en accounting
   */
  async markAsPaid(
    tenantId: string,
    orderId: string,
    paymentDetails: {
      paymentMethod?: string;
      transactionId?: string;
      paidAt?: Date;
    }
  ): Promise<Order> {
    const order = await prisma.order.findFirst({
      where: { tenantId, id: orderId }
    });

    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (order.status === 'CANCELLED') throw new Error('ORDER_CANCELLED');

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { tenantId_id: { tenantId, id: orderId } },
      data: { 
        status: 'PAID',
        paidAt: paymentDetails.paidAt || new Date()
      }
    });

    // Publish event - Invoice module luistert hier naar en maakt automatisch een invoice
    await eventBus.publish(createEvent(
      EventTypes.ORDER_PAID,
      tenantId,
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalCents: order.totalCents,
        currency: order.currency,
        ...paymentDetails
      }
    ));

    return updatedOrder;
  }

  /**
   * Cancel order - release reservations
   */
  async cancelOrder(
    tenantId: string,
    orderId: string,
    reason?: string
  ): Promise<Order> {
    const order = await prisma.order.findFirst({
      where: { tenantId, id: orderId },
      include: { lines: true }
    });

    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (order.status === 'FULFILLED') throw new Error('ORDER_ALREADY_FULFILLED');

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { tenantId_id: { tenantId, id: orderId } },
      data: { 
        status: 'CANCELLED',
        notes: reason ? `Cancelled: ${reason}` : 'Cancelled'
      }
    });

    // Release alle reservations
    for (const line of order.lines) {
      await eventBus.publish(createEvent(
        EventTypes.STOCK_RELEASED,
        tenantId,
        {
          orderId: order.id,
          orderLineId: line.id,
          variantId: line.variantId,
          quantity: line.quantity
        }
      ));
    }

    // Publish cancellation event
    await eventBus.publish(createEvent(
      EventTypes.ORDER_CANCELLED,
      tenantId,
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        reason
      }
    ));

    return updatedOrder;
  }
}

// Setup event handlers - deze luisteren naar events van andere modules
export function setupOrderEventHandlers() {
  // Luister naar stock.low events - maak support ticket
  eventBus.subscribe(EventTypes.STOCK_LOW, async (event) => {
    const { variantId, warehouseId, currentStock } = event.data;
    
    console.log(`[Orders] Stock low detected for variant ${variantId}`);
    // Zou hier een notification kunnen triggeren of orders kunnen pauzeren
  });

  // Luister naar customer.created - stuur welkomst email
  eventBus.subscribe(EventTypes.CUSTOMER_CREATED, async (event) => {
    const { customerId, email } = event.data;
    
    console.log(`[Orders] New customer ${customerId}, ready for first order`);
    // Zou hier een discount code kunnen sturen
  });

  // Luister naar shipment.delivered - mark order as fulfilled
  eventBus.subscribe(EventTypes.SHIPMENT_DELIVERED, async (event) => {
    const { orderId, tenantId } = event.data;
    
    await prisma.order.update({
      where: { tenantId_id: { tenantId, id: orderId } },
      data: { status: 'FULFILLED' }
    });

    // Publish fulfilled event
    await eventBus.publish(createEvent(
      EventTypes.ORDER_FULFILLED,
      tenantId,
      { orderId }
    ));
  });
}

// Initialize handlers when app starts
setupOrderEventHandlers();

export default EnhancedOrderService;
