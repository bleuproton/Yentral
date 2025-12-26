-- Phase 3: channel mappings, warehouse mappings, and stock/next-auth alignment

-- Enum for stock ledger kinds (legacy StockReason gets migrated to this)
DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StockLedgerKind') THEN
    CREATE TYPE "StockLedgerKind" AS ENUM ('RECEIPT', 'RESERVE', 'RELEASE', 'SHIP', 'RETURN', 'ADJUST');
  END IF;
END$$;

-- Drop tenant scoping from NextAuth tables (schema is global)
ALTER TABLE "Account" DROP CONSTRAINT IF EXISTS "Account_tenantId_fkey";
DROP INDEX IF EXISTS "Account_tenantId_provider_providerAccountId_key";
ALTER TABLE "Account" DROP COLUMN IF EXISTS "tenantId";

ALTER TABLE "Session" DROP CONSTRAINT IF EXISTS "Session_tenantId_fkey";
DROP INDEX IF EXISTS "Session_tenantId_sessionToken_key";
ALTER TABLE "Session" DROP COLUMN IF EXISTS "tenantId";

ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_tenantId_fkey";
DROP INDEX IF EXISTS "User_tenantId_email_key";
ALTER TABLE "User" DROP COLUMN IF EXISTS "tenantId";

-- Product: remove unused slug (sku is the identifier)
DROP INDEX IF EXISTS "Product_tenantId_slug_key";
DROP INDEX IF EXISTS "Product_tenantId_slug_idx";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "slug";

-- OrderLine: drop legacy orderId-only index (tenant-scoped index remains)
DROP INDEX IF EXISTS "OrderLine_orderId_idx";

-- Job reliability fields
DO $$BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Job' AND column_name='error') THEN
    ALTER TABLE "Job" RENAME COLUMN "error" TO "lastError";
  END IF;
END$$;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "correlationId" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "nextRunAt" TIMESTAMP(3);
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "priority" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "lockedAt" TIMESTAMP(3);
ALTER TABLE "Job" DROP COLUMN IF EXISTS "backoffSeconds";

-- Audit events: align actor column
ALTER TABLE "AuditEvent" DROP CONSTRAINT IF EXISTS "AuditEvent_actorId_fkey";
ALTER TABLE "AuditEvent" DROP CONSTRAINT IF EXISTS "AuditEvent_actorUserId_fkey";
DO $$BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='AuditEvent' AND column_name='actorId' AND column_name <> 'actorUserId') THEN
    ALTER TABLE "AuditEvent" RENAME COLUMN "actorId" TO "actorUserId";
  END IF;
END$$;
ALTER TABLE "AuditEvent" ADD COLUMN IF NOT EXISTS "actorUserId" TEXT;
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
DO $$BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'AuditEvent_tenantId_resource_idx')
     AND NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'AuditEvent_tenantId_resourceType_resourceId_idx') THEN
    ALTER INDEX "AuditEvent_tenantId_resource_idx" RENAME TO "AuditEvent_tenantId_resourceType_resourceId_idx";
  END IF;
END$$;

-- StockSnapshot updatedAt
ALTER TABLE "StockSnapshot" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- StockLedger: migrate from StockReason enum to StockLedgerKind + text reason
DO $$BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='StockLedger' AND column_name='reason') THEN
    BEGIN
      ALTER TABLE "StockLedger" RENAME COLUMN "reason" TO "reason_old";
    EXCEPTION WHEN duplicate_column THEN
      NULL;
    END;
  END IF;
END$$;
ALTER TABLE "StockLedger" ADD COLUMN IF NOT EXISTS "reason" TEXT;
ALTER TABLE "StockLedger" ADD COLUMN IF NOT EXISTS "correlationId" TEXT;
ALTER TABLE "StockLedger" ADD COLUMN IF NOT EXISTS "kind" "StockLedgerKind";
DO $$BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='StockLedger' AND column_name='reason_old') THEN
    UPDATE "StockLedger" SET "kind" = COALESCE("kind", ("reason_old"::text)::"StockLedgerKind");
    UPDATE "StockLedger" SET "reason" = COALESCE("reason", "reason_old"::text);
    ALTER TABLE "StockLedger" DROP COLUMN "reason_old";
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StockReason') THEN
      DROP TYPE "StockReason";
    END IF;
  END IF;
END$$;
UPDATE "StockLedger" SET "kind" = COALESCE("kind", 'ADJUST');
ALTER TABLE "StockLedger" ALTER COLUMN "kind" SET NOT NULL;
DO $$BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'StockLedger_tenantId_wh_variant_idx')
     AND NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'StockLedger_tenantId_warehouseId_variantId_idx') THEN
    ALTER INDEX "StockLedger_tenantId_wh_variant_idx" RENAME TO "StockLedger_tenantId_warehouseId_variantId_idx";
  END IF;
END$$;

-- StockReservation table
DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='StockReservation') THEN
    CREATE TABLE "StockReservation" (
      "id" TEXT PRIMARY KEY,
      "tenantId" TEXT NOT NULL,
      "orderLineId" TEXT NOT NULL,
      "warehouseId" TEXT NOT NULL,
      "variantId" TEXT NOT NULL,
      "qty" INTEGER NOT NULL,
      "status" "ReservationStatus" NOT NULL DEFAULT 'ACTIVE',
      "dedupeKey" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "StockReservation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "StockReservation_orderLineId_fkey" FOREIGN KEY ("orderLineId") REFERENCES "OrderLine"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "StockReservation_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "StockReservation_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE INDEX "StockReservation_tenantId_orderLineId_idx" ON "StockReservation"("tenantId","orderLineId");
    CREATE INDEX "StockReservation_tenantId_warehouseId_variantId_idx" ON "StockReservation"("tenantId","warehouseId","variantId");
    CREATE UNIQUE INDEX "StockReservation_tenantId_dedupeKey_key" ON "StockReservation"("tenantId","dedupeKey");
  END IF;
END$$;

-- Integration connections and channel mappings
DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='IntegrationConnection') THEN
    CREATE TABLE "IntegrationConnection" (
      "id" TEXT PRIMARY KEY,
      "tenantId" TEXT NOT NULL,
      "connectorVersionId" TEXT NOT NULL,
      "name" TEXT,
      "region" TEXT,
      "status" TEXT NOT NULL DEFAULT 'INACTIVE',
      "config" JSONB,
      "lastSyncAt" TIMESTAMP(3),
      "lastError" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "IntegrationConnection_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "IntegrationConnection_connectorVersionId_fkey" FOREIGN KEY ("connectorVersionId") REFERENCES "ConnectorVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE INDEX "IntegrationConnection_tenantId_connectorVersionId_idx" ON "IntegrationConnection"("tenantId","connectorVersionId");
    CREATE INDEX "IntegrationConnection_tenantId_status_idx" ON "IntegrationConnection"("tenantId","status");
  END IF;
END$$;

DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='WarehouseMapping') THEN
    CREATE TABLE "WarehouseMapping" (
      "id" TEXT PRIMARY KEY,
      "tenantId" TEXT NOT NULL,
      "connectionId" TEXT NOT NULL,
      "externalLocationId" TEXT NOT NULL,
      "warehouseId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "WarehouseMapping_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "WarehouseMapping_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "WarehouseMapping_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX "WarehouseMapping_tenantId_connectionId_externalLocationId_key" ON "WarehouseMapping"("tenantId","connectionId","externalLocationId");
    CREATE INDEX "WarehouseMapping_tenantId_warehouseId_idx" ON "WarehouseMapping"("tenantId","warehouseId");
  END IF;
END$$;

DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ChannelProduct') THEN
    CREATE TABLE "ChannelProduct" (
      "id" TEXT PRIMARY KEY,
      "tenantId" TEXT NOT NULL,
      "connectionId" TEXT NOT NULL,
      "productId" TEXT NOT NULL,
      "externalId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ChannelProduct_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "ChannelProduct_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "ChannelProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX "ChannelProduct_tenantId_connectionId_externalId_key" ON "ChannelProduct"("tenantId","connectionId","externalId");
    CREATE UNIQUE INDEX "ChannelProduct_tenantId_connectionId_productId_key" ON "ChannelProduct"("tenantId","connectionId","productId");
  END IF;
END$$;

DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ChannelVariant') THEN
    CREATE TABLE "ChannelVariant" (
      "id" TEXT PRIMARY KEY,
      "tenantId" TEXT NOT NULL,
      "connectionId" TEXT NOT NULL,
      "variantId" TEXT NOT NULL,
      "externalId" TEXT NOT NULL,
      "asin" TEXT,
      "externalSku" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ChannelVariant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "ChannelVariant_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "ChannelVariant_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX "ChannelVariant_tenantId_connectionId_externalId_key" ON "ChannelVariant"("tenantId","connectionId","externalId");
    CREATE UNIQUE INDEX "ChannelVariant_tenantId_connectionId_variantId_key" ON "ChannelVariant"("tenantId","connectionId","variantId");
  END IF;
END$$;

DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ChannelOrder') THEN
    CREATE TABLE "ChannelOrder" (
      "id" TEXT PRIMARY KEY,
      "tenantId" TEXT NOT NULL,
      "connectionId" TEXT NOT NULL,
      "orderId" TEXT NOT NULL,
      "externalOrderId" TEXT NOT NULL,
      "raw" JSONB,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ChannelOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "ChannelOrder_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "ChannelOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );
    CREATE UNIQUE INDEX "ChannelOrder_tenantId_connectionId_externalOrderId_key" ON "ChannelOrder"("tenantId","connectionId","externalOrderId");
    CREATE UNIQUE INDEX "ChannelOrder_tenantId_connectionId_orderId_key" ON "ChannelOrder"("tenantId","connectionId","orderId");
  END IF;
END$$;

-- Index renames for consistency
DO $$BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'InventoryReservation_tenant_orderLine_idx')
     AND NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'InventoryReservation_tenantId_orderLineId_idx') THEN
    ALTER INDEX "InventoryReservation_tenant_orderLine_idx" RENAME TO "InventoryReservation_tenantId_orderLineId_idx";
  END IF;
END$$;
DO $$BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'InventoryReservation_tenant_wh_variant_idx')
     AND NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'InventoryReservation_tenantId_warehouseId_variantId_idx') THEN
    ALTER INDEX "InventoryReservation_tenant_wh_variant_idx" RENAME TO "InventoryReservation_tenantId_warehouseId_variantId_idx";
  END IF;
END$$;
DO $$BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'StockSnapshot_tenant_wh_variant_key')
     AND NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'StockSnapshot_tenantId_warehouseId_variantId_key') THEN
    ALTER INDEX "StockSnapshot_tenant_wh_variant_key" RENAME TO "StockSnapshot_tenantId_warehouseId_variantId_key";
  END IF;
END$$;
