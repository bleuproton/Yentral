# Yentral

> Multi-tenant commerce & SaaS platform met moderne UI en krachtige integraties

Yentral is een backend-first multi-tenant commerce/SaaS platform gebouwd met Next.js 14 (App Router), Prisma, PostgreSQL, NextAuth, RBAC, Stripe billing, en een uitgebreide plugin/connector marketplace.

## ✨ Features

### 🏢 Multi-Tenancy & Auth
### 🏢 Multi-Tenancy & Auth
- Volledige multi-tenant architectuur met tenant isolatie
- NextAuth (Auth.js) met Prisma adapter
- Role-Based Access Control (RBAC): OWNER, ADMIN, MEMBER
- Secure session management met tenant context

### 💼 Commerce & Product Management
- Product Information Management (PIM)
- Product variants met SKU tracking
- Channel mappings voor multi-channel verkoop
- Inventory management met warehouse ondersteuning
- Real-time voorraad tracking en reserveringen

### 🔌 Integraties & Automations
- Connector marketplace met plugin systeem
- Tenant-scoped integration connections
- Amazon SP-API, Shopify, WooCommerce en meer
- Async job processing met pg-boss
- Warehouse en channel mappings

### 📊 Dashboard & UI
- Modern dark mode dashboard met Tailwind CSS
- Real-time statistieken en metrics
- Interactieve grafieken en visualisaties
- Responsive design voor alle devices
- Smooth animaties en hover effects

### 🎫 Support & Ticketing
- Ticket management systeem
- IMAP/SMTP email integratie
- SLA monitoring en tracking
- Customer support workflows

### 📦 Fulfillment
- Shipment management
- Return processing
- Inventory consumption tracking
- Multi-warehouse ondersteuning

### 💳 Billing & Payments
- Stripe integratie
- Subscription management
- Checkout flows
- Webhook handling

## 🚀 Snelstart

### Vereisten
- Node.js 20 LTS of hoger
- pnpm v10+ (package manager)
- PostgreSQL 14+ database
- Docker (optioneel, voor lokale database)

### Installatie

1. **Clone de repository**
```bash
git clone <repository-url>
cd Yentral
```

2. **Installeer dependencies**
```bash
# Installeer pnpm globaal (indien nog niet geïnstalleerd)
npm install -g pnpm

# Installeer alle dependencies
pnpm install
```

3. **Configureer environment variables**
```bash
# Kopieer het voorbeeld bestand
cp .env.example .env

# Bewerk .env en vul je configuratie in:
# - DATABASE_URL: PostgreSQL connection string
# - NEXTAUTH_URL: http://localhost:3000
# - NEXTAUTH_SECRET: genereer een random secret
# - STRIPE_SECRET_KEY: je Stripe API key
# - STRIPE_PRICE_ID: je Stripe price ID
```

4. **Setup database**
```bash
# Genereer Prisma client
pnpm prisma:generate

# Run database migrations
pnpm db:migrate

# Seed demo data (optioneel)
pnpm db:seed
# Demo credentials: admin@yentral.test / changeme123
```

5. **Start development server**
```bash
# Start Next.js server
pnpm dev

# In een andere terminal: start worker (optioneel)
pnpm worker:dev
```

6. **Open je browser**
```
http://localhost:3000
```

## 📝 Environment Variables

Maak een `.env` bestand aan met de volgende configuratie:

```env
# App
APP_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/yentral"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email Support (optioneel)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=support@yentral.com
IMAP_PASS=your-password
IMAP_TLS=true

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=support@yentral.com
SMTP_PASS=your-password
SMTP_FROM=support@yentral.com
```

## 🛠️ Development Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Build voor productie
pnpm start                  # Start productie server
pnpm lint                   # Run ESLint

# Database
pnpm db:migrate             # Run nieuwe migrations
pnpm db:deploy              # Deploy migrations (productie)
pnpm db:seed                # Seed demo data
pnpm db:studio              # Open Prisma Studio
pnpm db:validate            # Valideer schema
pnpm db:status              # Check migration status
pnpm db:reset               # Reset database (VOORZICHTIG!)

# Workers & Jobs
pnpm worker:dev             # Start worker (dev)
pnpm worker:once            # Run worker eenmalig
pnpm boss:worker            # Start pg-boss worker
pnpm scheduler:tick         # Run scheduler

# Testing
pnpm smoke:phase2-3         # Run smoke tests
pnpm smoke:fulfillment      # Test fulfillment
pnpm smoke:accounting       # Test accounting

# Health Checks
pnpm state:check            # Check applicatie status
pnpm db:check               # Check database health
pnpm db:health              # Database health check

# PostGraphile (GraphQL API)
pnpm postgraphile           # Start PostGraphile server (CLI mode)
pnpm postgraphile:cli       # Start PostGraphile CLI
pnpm postgraphile:server    # Start PostGraphile programmatic server
```

## 🏗️ Projectstructuur

```
Yentral/
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── (auth)/        # Auth pages (login, register)
│   │   ├── (dashboard)/   # Dashboard pages
│   │   ├── api/           # API routes
│   │   └── globals.css    # Global styles
│   ├── components/        # React components
│   │   ├── dashboard/     # Dashboard specifieke components
│   │   └── ui/           # Reusable UI components
│   ├── connectors/        # Integration connectors
│   ├── jobs/             # Background job processors
│   ├── lib/              # Utilities en helpers
│   ├── modules/          # Business logic modules
│   ├── plugins/          # Plugin systeem
│   ├── server/           # Server-side utilities
│   └── types/            # TypeScript types
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Database migrations
│   └── seed.js          # Seed script
├── worker/               # Background worker setup
├── scripts/              # Utility scripts
├── docs/                 # Documentatie
└── public/              # Static assets
```

## 🔐 Authenticatie

### Login
```bash
POST /api/auth/callback/credentials
Content-Type: application/x-www-form-urlencoded

email=admin@yentral.test&password=changeme123&tenant=demo
```

### Demo Account
Na het runnen van `pnpm db:seed`:
- Email: `admin@yentral.test`
- Password: `changeme123`
- Tenant: `demo`

## 🌐 API Endpoints

### Health & Status
- `GET /api/health` - Liveness probe
- `GET /api/me` - Huidige gebruiker info

### Products
- `GET /api/products` - Lijst alle producten
- `POST /api/products` - Maak nieuw product
- `GET /api/products/[id]` - Haal product op
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Verwijder product

### Integrations
- `GET /api/connectors` - Lijst beschikbare connectors
- `GET /api/connections` - Lijst actieve connecties
- `POST /api/connections` - Maak nieuwe connectie
- `PUT /api/connections/[id]` - Update connectie
- `POST /api/connections/[id]/test` - Test connectie

### Jobs
- `GET /api/jobs` - Lijst alle jobs
- `GET /api/jobs/[id]` - Job details
- `POST /api/jobs/[id]/retry` - Retry gefaalde job
- `POST /api/jobs/[id]/cancel` - Cancel job

### Support
- `GET /api/tickets` - Lijst tickets
- `POST /api/tickets` - Maak nieuw ticket
- `GET /api/tickets/[id]` - Ticket details
- `POST /api/tickets/[id]/reply` - Reageer op ticket
- `POST /api/tickets/[id]/assign` - Wijs ticket toe

### Fulfillment
- `GET /api/v1/shipments` - Lijst shipments
- `POST /api/v1/shipments` - Maak shipment
- `POST /api/v1/shipments/[id]/confirm` - Bevestig shipment
- `GET /api/v1/returns` - Lijst returns
- `POST /api/v1/returns` - Maak return
- `POST /api/v1/returns/[id]/receive` - Verwerk return

### Billing
- `POST /api/billing/create-checkout-session` - Stripe checkout (OWNER/ADMIN only)

### Plugins
- `POST /api/plugins/install` - Installeer plugin (OWNER/ADMIN only)

## 🐳 Docker

### Met Docker Compose
```bash
# Start alle services (app + database)
docker-compose up -d

# Stop services
docker-compose down

# Bekijk logs
docker-compose logs -f
```

### Standalone Docker
```bash
# Build image
docker build -t yentral:latest .

# Run container
docker run -p 3000:3000 --env-file .env yentral:latest
```

## 📚 Technologie Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL met Prisma ORM
- **GraphQL**: PostGraphile (instant GraphQL API)
- **Authentication**: NextAuth.js (Auth.js)
- **Styling**: Tailwind CSS + Radix UI
- **Job Queue**: pg-boss
- **Payments**: Stripe
- **Email**: IMAP/SMTP (Nodemailer)
- **TypeScript**: Full type safety
- **Icons**: Lucide React

## 🔌 PostGraphile GraphQL API

Yentral now includes PostGraphile integration for instant GraphQL API generation from your PostgreSQL database.

### Quick Start

Start PostGraphile server:
```bash
pnpm postgraphile
```

Access GraphiQL interface at: `http://localhost:5000/graphiql`

### Features

- 🚀 **Instant GraphQL API** - Auto-generated from database schema
- 🎨 **GraphiQL Interface** - Interactive API explorer
- 📡 **Real-time Subscriptions** - WebSocket support for live updates
- 👀 **Schema Watching** - Hot reload on database changes
- 🔐 **RLS Support** - Respects PostgreSQL row-level security

### Documentation

See [docs/POSTGRAPHILE.md](./docs/POSTGRAPHILE.md) for complete setup and usage guide.

### Integration Options

**CLI Mode** (standalone server):
```bash
pnpm postgraphile
```

**Programmatic Mode** (with Express):
```typescript
import { createPostGraphileMiddleware } from './scripts/postgraphile-server';
app.use(createPostGraphileMiddleware());
```

See [examples/express-postgraphile.ts](./examples/express-postgraphile.ts) for integration examples.
- **Icons**: Lucide React

## 🗺️ Roadmap

1. ✅ Multi-tenant core met RBAC
2. ✅ Dashboard met moderne UI
3. ✅ Product & Inventory management
4. ✅ Integration connectors
5. ✅ Support ticketing systeem
6. ✅ Fulfillment (shipments/returns)
7. 🚧 IMAP ingest + SMTP auto-reply
8. 🚧 Stripe billing lifecycle
9. 🚧 Flow orchestration (React Flow UI)
10. 🚧 Marketplace UX verbetering
11. 📋 FBA/MCF/3PL integraties
12. 📋 Advanced analytics & reporting

## 🤝 Contributing

Contributions zijn welkom! Volg deze stappen:

1. Fork de repository
2. Maak een feature branch (`git checkout -b feature/amazing-feature`)
3. Commit je changes (`git commit -m 'Add amazing feature'`)
4. Push naar de branch (`git push origin feature/amazing-feature`)
5. Open een Pull Request

## 📄 Licentie

Dit project is private en proprietary.

## 🆘 Support

Voor vragen of problemen:
- Open een issue op GitHub
- Check de [documentatie](./docs/)
- Contact: support@yentral.com

## 🎯 Status Checks

Valideer je setup met deze commands:

```bash
# Check alles in één keer
pnpm db:check-all

# Of individueel:
pnpm db:validate        # Schema validatie
pnpm db:status          # Migration status  
pnpm db:check           # Volledige database check
pnpm state:check        # Applicatie state check
```

---

**Built with ❤️ by the Yentral team**

## Smoke Tests
- Inventory & variants: `npx tsx scripts/smoke_phase2.ts`
- Channel mappings: `npx tsx scripts/smoke-phase3.ts`
- Combined Phase2/3: `npm run smoke:phase2-3`
- Fulfillment Phase4: `npm run smoke:phase4`
- Phase7 (jobs/integration sync + flow runner): `npm run smoke:phase7`

## Git Hooks (optional)
- Pre-push: run `pnpm db:check` to ensure migrations and schema are in sync.

## Migrations & Shadow DB
- `DATABASE_URL` points to your main database.
- `SHADOW_DATABASE_URL` is required for drift checks; create a separate empty database (e.g. `yentral_shadow`) and set the URL.
- Example:
  ```
  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/yentral?schema=public
  SHADOW_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/yentral_shadow?schema=public
  ```
- Common commands:
  ```bash
  npm run db:validate       # prisma validate
  npm run db:status         # prisma migrate status
  npm run db:verify         # verify applied migrations in DB vs local folders
  npm run db:check          # migrations + drift checks
  npm run db:check:migrations # check _prisma_migrations for unfinished/rolled-back
  npm run db:check:tenant   # tenantId + tenant uniques on core tables
  npm run db:check-all      # validate + status + migrations + tenant checks
  npm run db:migrate:dev    # apply migrations in dev
  npm run db:migrate:deploy # apply migrations in deploy/CI
  ```

## Deployment Checklist
1) Set env vars on the platform.
2) Run `pnpm install` and `pnpm prisma:deploy` during build/deploy.
3) Build/start (`pnpm build && pnpm start` or container image).
4) Smoke-test `/api/health`, `/api/me`, and a billing checkout session.

## Notes
- Stripe webhook handler not yet added; subscriptions should be verified manually until then.
- Upgrade Next.js to the latest patched release before production (current scaffold uses 14.2.5; see security advisories).
- All repository changes are logged in `changes.md`.
