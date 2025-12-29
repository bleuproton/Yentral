# Module Architectuur & Integratie Analyse

## 📊 Huidige Module Overzicht

### Core Modules
1. **Products** - Product catalog & variants
2. **Inventory** - Stock management & warehousing
3. **Orders** - Order processing
4. **Fulfillment** - Shipments & returns
5. **Customers** - Customer data
6. **Invoices** - Financial invoicing
7. **Integrations** - External system connectors
8. **Support** - Ticketing system
9. **Accounting** - Financial administration
10. **Settings** - Configuration

---

## 🔄 Module Relaties & Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                           TENANT CONTEXT                             │
└─────────────────────────────────────────────────────────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                           │
   ┌────▼────┐              ┌──────▼──────┐           ┌───────▼───────┐
   │ Products│              │ Integrations │           │   Settings    │
   │  & PIM  │◄─────────────┤   (Hub)      │───────────►│ Configuration│
   └────┬────┘              └──────┬──────┘           └───────────────┘
        │                          │
        │ variants                 │ sync/mappings
        │                          │
   ┌────▼────────┐          ┌──────▼──────┐           ┌───────────────┐
   │  Inventory  │          │   Orders    │           │   Customers   │
   │  Management │◄─────────┤ Processing  │◄──────────┤   CRM Data    │
   └────┬────────┘ reserve  └──────┬──────┘ customer  └───────┬───────┘
        │                          │                           │
        │ stock                    │ lines                     │
        │                          │                           │
   ┌────▼────────┐          ┌──────▼──────┐           ┌───────▼───────┐
   │ Fulfillment │          │  Invoices   │           │    Support    │
   │ Ship/Return │◄─────────┤  Financial  │───────────►│   Tickets     │
   └────┬────────┘          └──────┬──────┘           └───────────────┘
        │                          │
        │                          │
        │                   ┌──────▼──────┐
        └───────────────────►  Accounting │
                            │   Finance   │
                            └─────────────┘
```

---

## 🎯 Module Verbeteringen

### 1. **Products Module**

#### Huidige State
```typescript
// Huidige structuur
Product
  ├─ ProductVariant[]
  ├─ ProductMedia[]
  └─ Basic attributes
```

#### Verbeteringen
```typescript
// Verbeterde structuur met events
interface ProductModule {
  // Domain Models
  models: {
    Product
    ProductVariant
    ProductBundle        // NEW: Product bundling
    ProductCategory      // NEW: Categorization
    PriceRule           // NEW: Dynamic pricing
  }
  
  // Services
  services: {
    ProductService       // CRUD + business logic
    VariantService       // Variant management
    PricingService       // NEW: Centralized pricing
    CategoryService      // NEW: Category tree
    BundleService        // NEW: Bundle management
  }
  
  // Events (voor integratie)
  events: {
    'product.created'
    'product.updated'
    'product.archived'
    'variant.created'
    'price.changed'      // NEW
    'stock.low'          // NEW: Integration met Inventory
  }
}
```

**Integratie Punten:**
- ✅ **Inventory**: Variant SKU mapping, stock alerts
- ✅ **Orders**: Product/variant data, pricing
- ✅ **Integrations**: Channel product mappings
- 🆕 **Invoices**: Product line items met correcte pricing
- 🆕 **Accounting**: Product costs & margins

---

### 2. **Inventory Module**

#### Huidige State
```typescript
// Goed geïmplementeerd met:
StockLedger       // Audit trail
StockSnapshot     // Current state
StockReservation  // Order reservations
Warehouse         // Multi-location
```

#### Verbeteringen
```typescript
interface InventoryModule {
  models: {
    Warehouse
    StockLedger
    StockSnapshot
    StockReservation
    StockTransfer        // NEW: Between warehouses
    StockAlert          // NEW: Low stock notifications
    StockCount          // NEW: Physical counts/audits
  }
  
  services: {
    InventoryService
    ReservationService
    TransferService      // NEW
    AlertService         // NEW
    ForecastService      // NEW: Demand forecasting
  }
  
  events: {
    'stock.adjusted'
    'stock.reserved'
    'stock.released'
    'stock.consumed'
    'stock.low'          // NEW
    'stock.transferred'  // NEW
    'stock.counted'      // NEW
  }
}
```

**Integratie Punten:**
- ✅ **Products**: Variant SKU tracking
- ✅ **Orders**: Reservation flow
- ✅ **Fulfillment**: Stock consumption
- 🆕 **Integrations**: Multi-channel stock sync
- 🆕 **Support**: Stock inquiry for tickets

---

### 3. **Orders Module**

#### Huidige State
```typescript
Order
  ├─ OrderLine[]
  └─ Basic order management
```

#### Verbeteringen
```typescript
interface OrdersModule {
  models: {
    Order
    OrderLine
    OrderStatus         // Enhanced state machine
    OrderPayment        // NEW: Payment tracking
    OrderShipment       // Link to Fulfillment
    OrderNote           // NEW: Internal notes
    OrderTag            // NEW: Categorization
  }
  
  services: {
    OrderService
    OrderWorkflowService // NEW: State machine
    PaymentService       // NEW: Payment processing
    OrderSplitService    // NEW: Split orders
    RefundService        // NEW: Refund handling
  }
  
  events: {
    'order.created'
    'order.confirmed'     // NEW
    'order.paid'          // NEW
    'order.fulfilled'
    'order.cancelled'
    'order.refunded'      // NEW
    'order.split'         // NEW
  }
  
  // State Machine
  workflow: {
    DRAFT → PENDING → CONFIRMED → PAID → FULFILLING → FULFILLED
           ↓         ↓           ↓                      ↓
        CANCELLED  CANCELLED   CANCELLED           COMPLETED
                                                        ↓
                                                   RETURNED/REFUNDED
  }
}
```

**Integratie Punten:**
- ✅ **Products**: Line items
- ✅ **Inventory**: Reservations
- ✅ **Customers**: Customer linking
- ✅ **Fulfillment**: Shipment creation
- 🆕 **Invoices**: Auto-invoice creation
- 🆕 **Accounting**: Revenue recognition
- 🆕 **Integrations**: Channel orders
- 🆕 **Support**: Order inquiries

---

### 4. **Fulfillment Module**

#### Huidige State
```typescript
Shipment
  ├─ ShipmentLine[]
Return
  ├─ ReturnLine[]
```

#### Verbeteringen
```typescript
interface FulfillmentModule {
  models: {
    Shipment
    ShipmentLine
    Return
    ReturnLine
    FulfillmentProvider  // NEW: 3PL integration
    ShippingLabel        // NEW: Label management
    TrackingEvent        // NEW: Tracking history
    PackingSlip          // NEW: Packing documentation
  }
  
  services: {
    FulfillmentService
    ShipmentService
    ReturnService
    CarrierService       // NEW: Multi-carrier
    LabelService         // NEW: Label generation
    TrackingService      // NEW: Track & trace
  }
  
  events: {
    'shipment.created'
    'shipment.packed'     // NEW
    'shipment.shipped'
    'shipment.delivered'  // NEW
    'shipment.failed'     // NEW
    'return.created'
    'return.approved'
    'return.received'
    'return.refunded'     // NEW
  }
}
```

**Integratie Punten:**
- ✅ **Orders**: Order lines
- ✅ **Inventory**: Stock consumption/restock
- 🆕 **Invoices**: Shipping costs
- 🆕 **Customers**: Delivery address
- 🆕 **Support**: Shipping issues
- 🆕 **Integrations**: FBA/MCF/3PL

---

### 5. **Customers Module**

#### Huidige State
```typescript
Customer
  └─ Basic info
```

#### Verbeteringen
```typescript
interface CustomersModule {
  models: {
    Customer
    CustomerAddress      // NEW: Multiple addresses
    CustomerContact      // NEW: Contact points
    CustomerSegment      // NEW: Segmentation
    CustomerNote         // NEW: CRM notes
    CustomerTag          // NEW: Tagging
    LoyaltyPoints        // NEW: Loyalty program
  }
  
  services: {
    CustomerService
    AddressService       // NEW
    SegmentService       // NEW
    LoyaltyService       // NEW
    CommunicationService // NEW
  }
  
  events: {
    'customer.created'
    'customer.updated'
    'customer.segmented'  // NEW
    'customer.contacted'  // NEW
    'customer.churned'    // NEW
  }
}
```

**Integratie Punten:**
- ✅ **Orders**: Customer orders
- 🆕 **Invoices**: Billing information
- 🆕 **Support**: Customer tickets
- 🆕 **Fulfillment**: Shipping addresses
- 🆕 **Integrations**: Multi-channel customers
- 🆕 **Accounting**: Customer ledger

---

### 6. **Invoices Module**

#### Huidige State
```typescript
Invoice
  ├─ InvoiceLine[]
  └─ Basic invoicing
```

#### Verbeteringen
```typescript
interface InvoicesModule {
  models: {
    Invoice
    InvoiceLine
    InvoicePayment       // NEW: Payment tracking
    CreditNote           // NEW: Credits/refunds
    TaxConfiguration     // NEW: Tax rules
    PaymentTerm          // NEW: Payment terms
    InvoiceReminder      // NEW: Payment reminders
  }
  
  services: {
    InvoiceService
    PaymentService       // NEW
    TaxService           // NEW
    CreditNoteService    // NEW
    ReminderService      // NEW
    PDFGeneratorService  // NEW
  }
  
  events: {
    'invoice.created'
    'invoice.sent'        // NEW
    'invoice.paid'        // NEW
    'invoice.overdue'     // NEW
    'invoice.cancelled'   // NEW
    'credit.issued'       // NEW
  }
}
```

**Integratie Punten:**
- ✅ **Orders**: Auto-generate from orders
- 🆕 **Customers**: Billing info
- 🆕 **Accounting**: Journal entries
- 🆕 **Fulfillment**: Shipping charges
- 🆕 **Support**: Invoice disputes
- 🆕 **Integrations**: External accounting systems

---

### 7. **Integrations Module** (Central Hub)

#### Huidige State
```typescript
IntegrationConnection
Connector
ChannelProduct/Variant/Order mappings
```

#### Verbeteringen
```typescript
interface IntegrationsModule {
  models: {
    Connector
    ConnectorVersion
    IntegrationConnection
    ChannelProduct
    ChannelVariant
    ChannelOrder
    WarehouseMapping
    SyncJob              // NEW: Sync tracking
    MappingRule          // NEW: Field mapping
    RateLimitConfig      // NEW: API limits
  }
  
  services: {
    ConnectorService
    MappingService
    ChannelCatalogService
    ChannelOrderService
    SyncService          // NEW: Orchestration
    WebhookService       // NEW: Webhook handling
    RateLimiterService   // NEW
  }
  
  connectors: {
    'amazon-sp-api'
    'shopify'
    'woocommerce'
    'magento'
    'ebay'
    'stripe'             // NEW: Payment
    'xero'               // NEW: Accounting
    'quickbooks'         // NEW: Accounting
    'shipstation'        // NEW: Fulfillment
  }
  
  events: {
    'sync.started'
    'sync.completed'
    'sync.failed'
    'webhook.received'    // NEW
    'rate.limited'        // NEW
    'mapping.updated'     // NEW
  }
}
```

**Integratie Punten:**
- ✅ **Products**: Catalog sync
- ✅ **Inventory**: Stock sync
- ✅ **Orders**: Order import
- 🆕 **Customers**: Customer sync
- 🆕 **Fulfillment**: Shipping sync
- 🆕 **Invoices**: Accounting sync
- 🆕 **Support**: Support ticket sync

---

### 8. **Support Module**

#### Huidige State
```typescript
Ticket
  └─ Basic ticketing
```

#### Verbeteringen
```typescript
interface SupportModule {
  models: {
    Ticket
    TicketMessage        // NEW: Conversation thread
    TicketAttachment     // NEW: File uploads
    TicketTemplate       // NEW: Canned responses
    SLA                  // Enhanced SLA tracking
    KnowledgeBase        // NEW: Help articles
    TicketTag            // NEW: Categorization
  }
  
  services: {
    TicketService
    MessageService       // NEW
    SLAService
    EmailService         // IMAP/SMTP
    AssignmentService    // NEW: Auto-routing
    SearchService        // NEW: Ticket search
  }
  
  events: {
    'ticket.created'
    'ticket.assigned'     // NEW
    'ticket.replied'
    'ticket.escalated'    // NEW
    'ticket.resolved'
    'sla.breached'        // NEW
  }
}
```

**Integratie Punten:**
- 🆕 **Customers**: Customer context
- 🆕 **Orders**: Order inquiries
- 🆕 **Products**: Product questions
- 🆕 **Fulfillment**: Shipping issues
- 🆕 **Invoices**: Billing disputes
- 🆕 **Integrations**: External help desks

---

### 9. **Accounting Module**

#### Huidige State
```typescript
AccountingPeriod
JournalEntry (basic)
```

#### Verbeteringen
```typescript
interface AccountingModule {
  models: {
    AccountingPeriod
    ChartOfAccounts      // NEW: Account hierarchy
    JournalEntry
    JournalLine          // NEW: Line items
    GeneralLedger        // NEW: GL consolidation
    TaxRate              // NEW: Tax configuration
    BankAccount          // NEW: Bank reconciliation
    BankTransaction      // NEW: Transaction import
  }
  
  services: {
    AccountingService
    JournalService       // NEW
    ReconciliationService // NEW
    ReportingService     // NEW
    TaxService           // NEW
    PeriodService
    ExportService        // CSV/Excel/PDF
  }
  
  reports: {
    'balance-sheet'      // NEW
    'profit-loss'        // NEW
    'cash-flow'          // NEW
    'tax-summary'        // NEW
    'trial-balance'      // NEW
  }
  
  events: {
    'period.opened'
    'period.closed'
    'entry.posted'        // NEW
    'entry.voided'        // NEW
    'reconciliation.completed' // NEW
  }
}
```

**Integratie Punten:**
- 🆕 **Orders**: Revenue recognition
- 🆕 **Invoices**: AR entries
- 🆕 **Fulfillment**: COGS entries
- 🆕 **Inventory**: Asset valuation
- 🆕 **Products**: Cost tracking
- 🆕 **Integrations**: Xero/QuickBooks sync

---

### 10. **Settings Module**

#### Verbeteringen
```typescript
interface SettingsModule {
  models: {
    TenantSettings
    UserPreferences      // NEW
    EmailTemplate        // NEW
    NotificationRule     // NEW
    WebhookEndpoint      // NEW
    APIKey               // NEW
    AuditLog             // Enhanced
  }
  
  services: {
    SettingsService
    TemplateService      // NEW
    NotificationService  // NEW
    WebhookService       // NEW
    APIKeyService        // NEW
  }
  
  categories: {
    'general'
    'billing'
    'inventory'
    'fulfillment'
    'integrations'
    'notifications'      // NEW
    'security'           // NEW
  }
}
```

---

## 🔗 Cross-Module Integration Patterns

### Event-Driven Architecture

```typescript
// Centraal event systeem
interface EventBus {
  publish(event: DomainEvent): Promise<void>
  subscribe(pattern: string, handler: EventHandler): void
}

// Voorbeeld: Order → Multiple modules
order.created → {
  → inventory.reserve()
  → invoice.generate()
  → customer.updateStats()
  → accounting.createRevenue()
  → integrations.sync()
}
```

### Service Layer Pattern

```typescript
// Shared service interfaces
interface BaseService {
  tenant: TenantContext
  logger: Logger
  events: EventBus
  audit: AuditService
}

// Example: Order Service
class OrderService extends BaseService {
  constructor(
    private inventory: InventoryService,
    private products: ProductService,
    private customers: CustomerService,
    private invoices: InvoiceService
  ) {}
  
  async createOrder(input: CreateOrderInput) {
    // Validate with Products
    await this.products.validateAvailability(input.lines)
    
    // Reserve with Inventory
    const reservations = await this.inventory.reserve(input.lines)
    
    // Create order
    const order = await this.create(input)
    
    // Publish events
    await this.events.publish('order.created', order)
    
    // Return with linked data
    return { order, reservations }
  }
}
```

### Repository Pattern

```typescript
// Consistent data access
interface Repository<T> {
  findById(tenantId: string, id: string): Promise<T | null>
  findMany(tenantId: string, filter: Filter): Promise<T[]>
  create(tenantId: string, data: CreateData): Promise<T>
  update(tenantId: string, id: string, data: UpdateData): Promise<T>
  delete(tenantId: string, id: string): Promise<void>
}
```

---

## 📦 Voorgestelde Folder Structuur

```
src/
├── modules/
│   ├── products/
│   │   ├── models/
│   │   │   ├── product.model.ts
│   │   │   ├── variant.model.ts
│   │   │   └── bundle.model.ts
│   │   ├── services/
│   │   │   ├── product.service.ts
│   │   │   ├── variant.service.ts
│   │   │   └── pricing.service.ts
│   │   ├── repositories/
│   │   │   └── product.repository.ts
│   │   ├── events/
│   │   │   └── product.events.ts
│   │   └── index.ts
│   │
│   ├── inventory/
│   │   ├── models/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── events/
│   │   └── index.ts
│   │
│   ├── orders/
│   │   ├── models/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── workflows/        # NEW: State machines
│   │   ├── events/
│   │   └── index.ts
│   │
│   ├── fulfillment/
│   ├── customers/
│   ├── invoices/
│   ├── integrations/
│   │   ├── connectors/       # Connector implementations
│   │   │   ├── amazon/
│   │   │   ├── shopify/
│   │   │   └── stripe/
│   │   ├── services/
│   │   └── mappings/
│   │
│   ├── support/
│   ├── accounting/
│   └── settings/
│
├── shared/
│   ├── events/               # Event bus
│   ├── auth/                 # Authentication
│   ├── validation/           # Zod schemas
│   ├── errors/               # Error classes
│   └── utils/
│
└── app/
    ├── api/                  # API routes
    └── (dashboard)/          # UI pages
```

---

## 🎯 Implementatie Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Setup event bus systeem
- [ ] Implement base service classes
- [ ] Standardize repository pattern
- [ ] Add comprehensive logging

### Phase 2: Core Modules (Week 3-4)
- [ ] Enhance Products module (bundling, pricing)
- [ ] Upgrade Orders module (workflow engine)
- [ ] Improve Inventory (transfers, alerts)
- [ ] Extend Customers (addresses, segments)

### Phase 3: Financial (Week 5-6)
- [ ] Complete Invoices module
- [ ] Build Accounting module
- [ ] Integrate payment processing
- [ ] Add tax calculations

### Phase 4: Operations (Week 7-8)
- [ ] Enhance Fulfillment (carriers, tracking)
- [ ] Upgrade Support (SLA, automation)
- [ ] Add reporting dashboards
- [ ] Implement notifications

### Phase 5: Integrations (Week 9-10)
- [ ] Add more connectors
- [ ] Sync orchestration
- [ ] Webhook management
- [ ] Rate limiting

---

## 🔍 Monitoring & Observability

```typescript
// Add to each module
interface ModuleMetrics {
  operations: {
    'module.operation.duration': Histogram
    'module.operation.errors': Counter
    'module.operation.success': Counter
  }
  
  health: {
    'module.health': Gauge
    'module.dependencies': Gauge
  }
}
```

---

## ✅ Best Practices

1. **Tenant Isolation**: Alle queries MOETEN tenantId filter hebben
2. **Event Publishing**: Belangrijke acties publishen events
3. **Error Handling**: Consistente error types gebruiken
4. **Logging**: Structured logging met correlation IDs
5. **Validation**: Zod schemas voor alle inputs
6. **Testing**: Unit + integration tests per module
7. **Documentation**: API docs + module docs
8. **Performance**: Indexen op veel-gebruikte queries

---

Deze architectuur zorgt voor:
✅ Losse koppeling tussen modules
✅ Herbruikbare services
✅ Uitbreidbaar event systeem
✅ Consistente data access
✅ Betere testbaarheid
✅ Schaalbare integraties
