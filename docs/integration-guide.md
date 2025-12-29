# Module Integratie - Quick Start Guide

## 🚀 Hoe te gebruiken

### 1. Initialize Event System

In je `app/layout.tsx` of een centrale startup file:

```typescript
// app/layout.tsx of src/lib/startup.ts
import { initializeAllEventHandlers } from '@/modules/integration-setup';

// Call dit één keer bij app start
initializeAllEventHandlers();
```

### 2. Use in API Routes

Voorbeeld: Order API met automatische integraties

```typescript
// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import EnhancedOrderService from '@/modules/orders/services/enhanced-order.service';
import { getServerAuthSession } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  // Auth check
  const session = await getServerAuthSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const tenantId = cookies().get('tenantId')?.value;
  if (!tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 400 });

  // Parse input
  const body = await req.json();
  
  // Create order - dit triggert automatisch:
  // - Stock validation
  // - Customer updates
  // - Integration syncs
  // - Audit logging
  const orderService = new EnhancedOrderService();
  const order = await orderService.createOrder({
    tenantId,
    customerId: body.customerId,
    customerEmail: body.customerEmail,
    lines: body.lines,
    currency: body.currency,
    notes: body.notes
  });

  return NextResponse.json({ order });
}
```

### 3. Confirm Order (Reserveert Stock)

```typescript
// app/api/orders/[id]/confirm/route.ts
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerAuthSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const tenantId = cookies().get('tenantId')?.value;
  if (!tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 400 });

  const { warehouseId } = await req.json();
  
  const orderService = new EnhancedOrderService();
  
  // Dit triggert automatisch:
  // - Inventory reservations
  // - Stock updates
  // - Low stock alerts (als nodig)
  // - Fulfillment preparation
  const order = await orderService.confirmOrder(tenantId, params.id, warehouseId);

  return NextResponse.json({ order });
}
```

### 4. Mark as Paid (Triggert Invoice + Accounting)

```typescript
// app/api/orders/[id]/pay/route.ts
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerAuthSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const tenantId = cookies().get('tenantId')?.value;
  if (!tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 400 });

  const { paymentMethod, transactionId } = await req.json();
  
  const orderService = new EnhancedOrderService();
  
  // Dit triggert automatisch:
  // - Invoice creation
  // - Accounting journal entries
  // - Customer stats update
  // - Fulfillment start
  const order = await orderService.markAsPaid(tenantId, params.id, {
    paymentMethod,
    transactionId,
    paidAt: new Date()
  });

  return NextResponse.json({ order });
}
```

## 📊 Event Flow Diagram

```
User Action          Event Triggered                 Modules That Respond
───────────         ─────────────────               ────────────────────

POST /orders   →    order.created          →        • Inventory (validate stock)
                                                     • Customer (update stats)
                                                     • Integrations (sync)
                                                     • Audit (log)

POST /orders/      order.confirmed        →        • Inventory (reserve stock)
     {id}/confirm                                   • Fulfillment (prepare shipment)
                                                     • Support (if stock low)

POST /orders/      order.paid             →        • Invoices (create invoice)
     {id}/pay                                       • Accounting (journal entry)
                                                     • Fulfillment (start shipping)
                                                     • Customer (loyalty points)

Shipment ships →   shipment.shipped       →        • Inventory (consume stock)
                                                     • Accounting (COGS entry)
                                                     • Customer (notification)

Shipment           shipment.delivered     →        • Orders (mark fulfilled)
delivered                                           • Customer (review request)
                                                     • Accounting (revenue recognition)
```

## 🎯 Voordelen van deze Architectuur

### ✅ Losse Koppeling
Modules hoeven elkaar niet direct aan te roepen. Orders module weet niets van Invoices, maar Invoice wordt toch automatisch gemaakt.

### ✅ Uitbreidbaar
Nieuwe functionaliteit toevoegen zonder bestaande code te wijzigen:

```typescript
// Voeg nieuwe handler toe voor email notifications
eventBus.subscribe(EventTypes.ORDER_CREATED, async (event) => {
  await sendEmail({
    to: event.data.customerEmail,
    subject: 'Order Confirmation',
    body: `Your order #${event.data.orderNumber} has been created!`
  });
});
```

### ✅ Testbaar
Elke module kan apart getest worden:

```typescript
// Test order service zonder andere modules
it('creates order and publishes event', async () => {
  const mockEventBus = createMockEventBus();
  const service = new EnhancedOrderService();
  
  const order = await service.createOrder(input);
  
  expect(mockEventBus.published).toContain('order.created');
});
```

### ✅ Debugbaar
Alle events worden gelogd:

```typescript
[Event] order.created { tenantId: 'demo', timestamp: '2025-12-29...' }
[Inventory] Validating stock for order order_123
[Customer] Updating stats for customer cust_456
[Integrations] Syncing order to Shopify
[Audit] Logging order creation
```

## 🔄 Complete Order Flow Voorbeeld

```typescript
// 1. Customer places order on frontend
const response = await fetch('/api/orders', {
  method: 'POST',
  body: JSON.stringify({
    customerId: 'cust_123',
    customerEmail: 'john@example.com',
    lines: [
      { productId: 'prod_1', variantId: 'var_1', quantity: 2, unitCents: 1000 }
    ],
    currency: 'EUR'
  })
});
// → Triggers: order.created event
// → Inventory validates stock
// → Customer stats updated
// → Synced to integrations

// 2. Admin confirms order
await fetch('/api/orders/order_123/confirm', {
  method: 'POST',
  body: JSON.stringify({ warehouseId: 'wh_1' })
});
// → Triggers: order.confirmed event
// → Inventory reserves 2 units
// → Fulfillment prepares shipment

// 3. Payment received
await fetch('/api/orders/order_123/pay', {
  method: 'POST',
  body: JSON.stringify({
    paymentMethod: 'stripe',
    transactionId: 'ch_123'
  })
});
// → Triggers: order.paid event
// → Invoice automatically created (INV-00001)
// → Accounting journal entry posted
// → Fulfillment picks and packs order

// 4. Order ships
await fetch('/api/shipments/ship_123/ship', {
  method: 'POST',
  body: JSON.stringify({
    carrier: 'DHL',
    trackingNo: 'DHL123456'
  })
});
// → Triggers: shipment.shipped event
// → Inventory consumes 2 units from stock
// → Customer receives tracking email
// → Accounting posts COGS entry

// 5. Customer receives package
// (Carrier webhook or manual confirmation)
// → Triggers: shipment.delivered event
// → Order marked as FULFILLED
// → Customer receives review request
// → Accounting recognizes revenue
```

## 💡 Best Practices

### 1. Altijd TenantId Meegeven
```typescript
await eventBus.publish(createEvent(
  EventTypes.ORDER_CREATED,
  tenantId,  // ← VERPLICHT voor multi-tenant isolatie
  data
));
```

### 2. Gebruik CorrelationId voor Tracing
```typescript
const correlationId = generateId();

await eventBus.publish(createEvent(
  EventTypes.ORDER_CREATED,
  tenantId,
  data,
  { correlationId }  // ← Trace hele flow
));
```

### 3. Error Handling in Handlers
```typescript
eventBus.subscribe(EventTypes.ORDER_CREATED, async (event) => {
  try {
    await processOrder(event.data);
  } catch (error) {
    // Log error maar throw niet - andere handlers moeten kunnen draaien
    console.error('[Handler Error]', error);
    
    // Optioneel: publish error event voor monitoring
    await eventBus.publish(createEvent(
      'system.error',
      event.tenantId,
      { originalEvent: event.type, error: error.message }
    ));
  }
});
```

### 4. Idempotency
```typescript
// Gebruik deduplication keys voor idempotency
eventBus.subscribe(EventTypes.ORDER_PAID, async (event) => {
  const { orderId, tenantId } = event.data;
  
  // Check if invoice already exists
  const existing = await prisma.invoice.findFirst({
    where: { tenantId, orderId }
  });
  
  if (existing) {
    console.log('Invoice already exists, skipping');
    return;  // ← Idempotent
  }
  
  // Create invoice...
});
```

## 📈 Monitoring

```typescript
// Setup monitoring voor production
eventBus.subscribeAll(async (event) => {
  // Send to monitoring service (DataDog, NewRelic, etc)
  await monitoring.track('domain.event', {
    type: event.type,
    tenantId: event.tenantId,
    timestamp: event.timestamp
  });
  
  // Track latency
  const startTime = Date.now();
  // ... handler execution
  const duration = Date.now() - startTime;
  
  await monitoring.histogram('event.handler.duration', duration, {
    eventType: event.type
  });
});
```

---

Deze architectuur zorgt ervoor dat je modules **losjes gekoppeld** zijn maar **sterk geïntegreerd** werken! 🚀
