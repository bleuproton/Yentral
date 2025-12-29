/**
 * Event Bus - Centraal systeem voor cross-module communicatie
 * 
 * Gebruik:
 * - Modules publishen events wanneer belangrijke acties plaatsvinden
 * - Andere modules subscriben op events en reageren daarop
 * - Zorgt voor losse koppeling tussen modules
 */

import { EventEmitter } from 'events';

export interface DomainEvent<T = any> {
  type: string;
  tenantId: string;
  data: T;
  timestamp: Date;
  correlationId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export type EventHandler<T = any> = (event: DomainEvent<T>) => Promise<void> | void;

class EventBus {
  private emitter: EventEmitter;
  private handlers: Map<string, Set<EventHandler>>;

  constructor() {
    this.emitter = new EventEmitter();
    this.handlers = new Map();
    this.emitter.setMaxListeners(100); // Support many subscribers
  }

  /**
   * Publish een event naar alle subscribers
   */
  async publish<T>(event: DomainEvent<T>): Promise<void> {
    const { type, tenantId, data, correlationId } = event;
    
    console.log(`[EventBus] Publishing: ${type}`, {
      tenantId,
      correlationId,
      timestamp: event.timestamp
    });

    // Emit naar alle pattern matches
    this.emitter.emit(type, event);
    this.emitter.emit('*', event); // Wildcard voor logging/monitoring

    // Execute handlers
    const handlers = this.handlers.get(type) || new Set();
    const promises = Array.from(handlers).map(handler =>
      this.executeHandler(handler, event)
    );

    await Promise.allSettled(promises);
  }

  /**
   * Subscribe op een specifiek event type
   */
  subscribe<T>(eventType: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    
    this.handlers.get(eventType)!.add(handler as EventHandler);
    this.emitter.on(eventType, handler);

    // Return unsubscribe functie
    return () => {
      this.handlers.get(eventType)?.delete(handler as EventHandler);
      this.emitter.off(eventType, handler);
    };
  }

  /**
   * Subscribe op alle events (voor logging/monitoring)
   */
  subscribeAll(handler: EventHandler): () => void {
    this.emitter.on('*', handler);
    return () => this.emitter.off('*', handler);
  }

  private async executeHandler<T>(handler: EventHandler<T>, event: DomainEvent<T>): Promise<void> {
    try {
      await handler(event);
    } catch (error) {
      console.error(`[EventBus] Handler failed for ${event.type}:`, error);
      // Don't throw - één falende handler mag andere niet blokkeren
    }
  }

  /**
   * Clear alle subscribers (voor testing)
   */
  clear(): void {
    this.emitter.removeAllListeners();
    this.handlers.clear();
  }
}

// Singleton instance
export const eventBus = new EventBus();

// Helper functie voor het maken van events
export function createEvent<T>(
  type: string,
  tenantId: string,
  data: T,
  options?: {
    correlationId?: string;
    userId?: string;
    metadata?: Record<string, any>;
  }
): DomainEvent<T> {
  return {
    type,
    tenantId,
    data,
    timestamp: new Date(),
    ...options
  };
}

// Event types enum voor type safety
export const EventTypes = {
  // Products
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_ARCHIVED: 'product.archived',
  VARIANT_CREATED: 'variant.created',
  PRICE_CHANGED: 'price.changed',

  // Inventory
  STOCK_ADJUSTED: 'stock.adjusted',
  STOCK_RESERVED: 'stock.reserved',
  STOCK_RELEASED: 'stock.released',
  STOCK_CONSUMED: 'stock.consumed',
  STOCK_LOW: 'stock.low',
  STOCK_TRANSFERRED: 'stock.transferred',

  // Orders
  ORDER_CREATED: 'order.created',
  ORDER_CONFIRMED: 'order.confirmed',
  ORDER_PAID: 'order.paid',
  ORDER_FULFILLED: 'order.fulfilled',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_REFUNDED: 'order.refunded',

  // Fulfillment
  SHIPMENT_CREATED: 'shipment.created',
  SHIPMENT_SHIPPED: 'shipment.shipped',
  SHIPMENT_DELIVERED: 'shipment.delivered',
  RETURN_CREATED: 'return.created',
  RETURN_RECEIVED: 'return.received',

  // Invoices
  INVOICE_CREATED: 'invoice.created',
  INVOICE_SENT: 'invoice.sent',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_OVERDUE: 'invoice.overdue',

  // Support
  TICKET_CREATED: 'ticket.created',
  TICKET_ASSIGNED: 'ticket.assigned',
  TICKET_RESOLVED: 'ticket.resolved',
  SLA_BREACHED: 'sla.breached',

  // Integrations
  SYNC_STARTED: 'sync.started',
  SYNC_COMPLETED: 'sync.completed',
  SYNC_FAILED: 'sync.failed',

  // Customers
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes];
