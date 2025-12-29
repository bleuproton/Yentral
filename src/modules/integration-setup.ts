/**
 * Cross-Module Integration Examples
 * 
 * Dit bestand laat zien hoe verschillende modules op elkaar reageren via events
 */

import { eventBus, EventTypes, createEvent } from '@/shared/events/event-bus';
import prisma from '@/lib/prisma';

// ============================================================================
// INVENTORY MODULE - Reageert op Order Events
// ============================================================================

export function setupInventoryEventHandlers() {
  // Wanneer order confirmed wordt, reserveer stock
  eventBus.subscribe(EventTypes.ORDER_CONFIRMED, async (event) => {
    const { tenantId, data } = event;
    const { orderId, warehouseId } = data;

    console.log(`[Inventory] Reserving stock for order ${orderId}`);

    const order = await prisma.order.findFirst({
      where: { tenantId, id: orderId },
      include: { lines: true }
    });

    if (!order) return;

    // Reserve stock voor elke line
    for (const line of order.lines) {
      if (!line.variantId) continue;

      // Check current stock
      const snapshot = await prisma.stockSnapshot.findFirst({
        where: { tenantId, variantId: line.variantId, warehouseId }
      });

      if (!snapshot || snapshot.available < line.quantity) {
        // Stock te laag - publish event
        await eventBus.publish(createEvent(
          EventTypes.STOCK_LOW,
          tenantId,
          {
            variantId: line.variantId,
            warehouseId,
            required: line.quantity,
            available: snapshot?.available || 0
          }
        ));
        continue;
      }

      // Create reservation
      await prisma.stockReservation.create({
        data: {
          tenantId,
          orderLineId: line.id,
          variantId: line.variantId,
          warehouseId,
          qty: line.quantity,
          status: 'ACTIVE'
        }
      });

      // Update snapshot
      await prisma.stockSnapshot.update({
        where: { tenantId_warehouseId_variantId: { tenantId, warehouseId, variantId: line.variantId } },
        data: {
          reserved: { increment: line.quantity },
          available: { decrement: line.quantity }
        }
      });
    }

    console.log(`[Inventory] Stock reserved for order ${orderId}`);
  });

  // Wanneer order cancelled, release reservations
  eventBus.subscribe(EventTypes.ORDER_CANCELLED, async (event) => {
    const { tenantId, data } = event;
    const { orderId } = data;

    console.log(`[Inventory] Releasing reservations for cancelled order ${orderId}`);

    const reservations = await prisma.stockReservation.findMany({
      where: { tenantId, orderLine: { orderId }, status: 'ACTIVE' }
    });

    for (const res of reservations) {
      await prisma.stockReservation.update({
        where: { tenantId_id: { tenantId, id: res.id } },
        data: { status: 'RELEASED' }
      });

      await prisma.stockSnapshot.update({
        where: { 
          tenantId_warehouseId_variantId: { 
            tenantId, 
            warehouseId: res.warehouseId, 
            variantId: res.variantId 
          } 
        },
        data: {
          reserved: { decrement: res.qty },
          available: { increment: res.qty }
        }
      });
    }
  });
}

// ============================================================================
// INVOICE MODULE - Reageert op Order Events
// ============================================================================

export function setupInvoiceEventHandlers() {
  // Wanneer order paid wordt, maak automatisch een invoice
  eventBus.subscribe(EventTypes.ORDER_PAID, async (event) => {
    const { tenantId, data } = event;
    const { orderId, totalCents, currency } = data;

    console.log(`[Invoices] Creating invoice for paid order ${orderId}`);

    const order = await prisma.order.findFirst({
      where: { tenantId, id: orderId },
      include: { lines: true }
    });

    if (!order) return;

    // Check if invoice already exists
    const existing = await prisma.invoice.findFirst({
      where: { tenantId, orderId }
    });

    if (existing) {
      console.log(`[Invoices] Invoice already exists for order ${orderId}`);
      return;
    }

    // Generate invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      where: { tenantId },
      orderBy: { invoiceNumber: 'desc' }
    });
    const invoiceNumber = `INV-${String((lastInvoice?.invoiceNumber ? parseInt(lastInvoice.invoiceNumber.split('-')[1]) : 0) + 1).padStart(5, '0')}`;

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        orderId,
        invoiceNumber,
        status: 'PAID',
        currency: order.currency,
        subtotalCents: totalCents,
        taxCents: 0,
        totalCents,
        paidAt: new Date()
      }
    });

    // Create invoice lines
    for (const line of order.lines) {
      await prisma.invoiceLine.create({
        data: {
          tenantId,
          invoiceId: invoice.id,
          orderLineId: line.id,
          variantId: line.variantId,
          description: `Order #${order.orderNumber} - Line ${line.id}`,
          qty: line.quantity,
          unitCents: line.unitCents,
          totalCents: line.totalCents
        }
      });
    }

    // Publish event
    await eventBus.publish(createEvent(
      EventTypes.INVOICE_CREATED,
      tenantId,
      {
        invoiceId: invoice.id,
        invoiceNumber,
        orderId,
        totalCents
      }
    ));

    console.log(`[Invoices] Invoice ${invoiceNumber} created for order ${orderId}`);
  });
}

// ============================================================================
// FULFILLMENT MODULE - Reageert op Order Events
// ============================================================================

export function setupFulfillmentEventHandlers() {
  // Wanneer order paid, maak shipment klaar
  eventBus.subscribe(EventTypes.ORDER_PAID, async (event) => {
    const { tenantId, data } = event;
    const { orderId } = data;

    console.log(`[Fulfillment] Preparing shipment for order ${orderId}`);

    const order = await prisma.order.findFirst({
      where: { tenantId, id: orderId },
      include: { lines: true }
    });

    if (!order) return;

    // Find warehouse met stock
    const firstLine = order.lines[0];
    if (!firstLine?.variantId) return;

    const snapshot = await prisma.stockSnapshot.findFirst({
      where: { 
        tenantId, 
        variantId: firstLine.variantId,
        available: { gte: firstLine.quantity }
      }
    });

    if (!snapshot) {
      console.log(`[Fulfillment] No warehouse with sufficient stock for order ${orderId}`);
      return;
    }

    // Create shipment (zou in een queue kunnen voor processing)
    console.log(`[Fulfillment] Shipment ready for order ${orderId} from warehouse ${snapshot.warehouseId}`);
  });
}

// ============================================================================
// SUPPORT MODULE - Reageert op Problematische Events
// ============================================================================

export function setupSupportEventHandlers() {
  // Maak ticket wanneer stock te laag is
  eventBus.subscribe(EventTypes.STOCK_LOW, async (event) => {
    const { tenantId, data } = event;
    const { variantId, warehouseId, required, available } = data;

    console.log(`[Support] Creating low stock ticket for variant ${variantId}`);

    // Get variant info
    const variant = await prisma.productVariant.findFirst({
      where: { tenantId, id: variantId },
      include: { product: true }
    });

    if (!variant) return;

    // Create internal ticket
    await prisma.ticket.create({
      data: {
        tenantId,
        title: `Low Stock Alert: ${variant.product.name} (${variant.sku})`,
        description: `Stock level is below requirement.\nRequired: ${required}\nAvailable: ${available}\nWarehouse: ${warehouseId}`,
        status: 'OPEN',
        priority: 'HIGH',
        category: 'INVENTORY',
        source: 'SYSTEM'
      }
    });

    await eventBus.publish(createEvent(
      EventTypes.TICKET_CREATED,
      tenantId,
      {
        type: 'LOW_STOCK',
        variantId,
        warehouseId
      }
    ));
  });

  // Maak ticket wanneer shipment faalt
  eventBus.subscribe('shipment.failed', async (event) => {
    const { tenantId, data } = event;
    const { shipmentId, orderId, reason } = data;

    await prisma.ticket.create({
      data: {
        tenantId,
        title: `Shipment Failed: Order #${orderId}`,
        description: `Shipment ${shipmentId} failed.\nReason: ${reason}`,
        status: 'OPEN',
        priority: 'URGENT',
        category: 'FULFILLMENT',
        source: 'SYSTEM'
      }
    });
  });
}

// ============================================================================
// ACCOUNTING MODULE - Reageert op Financial Events
// ============================================================================

export function setupAccountingEventHandlers() {
  // Create journal entry wanneer invoice paid
  eventBus.subscribe(EventTypes.INVOICE_PAID, async (event) => {
    const { tenantId, data } = event;
    const { invoiceId, totalCents } = data;

    console.log(`[Accounting] Creating journal entry for invoice ${invoiceId}`);

    // Create journal entry (vereenvoudigd voorbeeld)
    await prisma.journalEntry.create({
      data: {
        tenantId,
        date: new Date(),
        description: `Invoice payment received`,
        debitAccountId: 'BANK',      // Zou een echte account ID zijn
        creditAccountId: 'REVENUE',  // Zou een echte account ID zijn
        amountCents: totalCents,
        reference: invoiceId
      }
    });
  });

  // Create COGS entry wanneer shipment shipped
  eventBus.subscribe(EventTypes.SHIPMENT_SHIPPED, async (event) => {
    const { tenantId, data } = event;
    const { shipmentId, orderId } = data;

    console.log(`[Accounting] Creating COGS entry for shipment ${shipmentId}`);

    // Zou hier COGS berekenen en journal entry maken
  });
}

// ============================================================================
// CUSTOMER MODULE - Reageert op Events
// ============================================================================

export function setupCustomerEventHandlers() {
  // Update customer stats wanneer order created
  eventBus.subscribe(EventTypes.ORDER_CREATED, async (event) => {
    const { tenantId, data } = event;
    const { customerId, totalCents } = data;

    if (!customerId) return;

    // Update customer lifetime value
    const customer = await prisma.customer.findFirst({
      where: { tenantId, id: customerId }
    });

    if (customer) {
      await prisma.customer.update({
        where: { tenantId_id: { tenantId, id: customerId } },
        data: {
          totalOrdersCents: { increment: totalCents },
          orderCount: { increment: 1 },
          lastOrderAt: new Date()
        }
      });
    }
  });
}

// ============================================================================
// INTEGRATION MODULE - Sync naar externe systemen
// ============================================================================

export function setupIntegrationEventHandlers() {
  // Sync order naar external channels
  eventBus.subscribe(EventTypes.ORDER_CREATED, async (event) => {
    const { tenantId, data } = event;
    const { orderId } = data;

    console.log(`[Integrations] Syncing order ${orderId} to external systems`);

    // Find active integrations
    const connections = await prisma.integrationConnection.findMany({
      where: { tenantId, status: 'ACTIVE' }
    });

    for (const conn of connections) {
      // Zou hier een sync job enqueuen
      console.log(`[Integrations] Queuing sync to ${conn.name}`);
    }
  });

  // Update inventory in channels wanneer stock changes
  eventBus.subscribe(EventTypes.STOCK_ADJUSTED, async (event) => {
    const { tenantId, data } = event;
    const { variantId, warehouseId } = data;

    console.log(`[Integrations] Syncing stock update to channels`);
    // Zou stock updates naar Shopify/Amazon etc sturen
  });
}

// ============================================================================
// Initialize All Event Handlers
// ============================================================================

export function initializeAllEventHandlers() {
  console.log('[Events] Initializing all event handlers...');
  
  setupInventoryEventHandlers();
  setupInvoiceEventHandlers();
  setupFulfillmentEventHandlers();
  setupSupportEventHandlers();
  setupAccountingEventHandlers();
  setupCustomerEventHandlers();
  setupIntegrationEventHandlers();

  // Setup global error handler
  eventBus.subscribeAll(async (event) => {
    // Log all events voor debugging
    console.log(`[Event] ${event.type}`, {
      tenantId: event.tenantId,
      timestamp: event.timestamp,
      correlationId: event.correlationId
    });
  });

  console.log('[Events] All event handlers initialized ✓');
}
