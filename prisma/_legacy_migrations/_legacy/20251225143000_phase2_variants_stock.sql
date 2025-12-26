-- Phase 2 adjustment: align stock models to StockLedgerKind, StockReservation, and snapshot updates.

-- Create StockLedgerKind enum if not exists
DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StockLedgerKind') THEN
    CREATE TYPE "StockLedgerKind" AS ENUM ('RECEIPT','RESERVE','RELEASE','SHIP','RETURN','ADJUST');
  END IF;
END$$;

-- Add new columns to StockLedger
ALTER TABLE "StockLedger" ADD COLUMN IF NOT EXISTS "kind" "StockLedgerKind";
ALTER TABLE "StockLedger" ADD COLUMN IF NOT EXISTS "reason" TEXT;
ALTER TABLE "StockLedger" ADD COLUMN IF NOT EXISTS "correlationId" TEXT;

-- Backfill kind from legacy "reason" enum if present
DO $$BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='StockLedger' AND column_name='reason' AND udt_name='StockReason') THEN
    UPDATE "StockLedger" SET "kind" = "reason"::text::"StockLedgerKind" WHERE "kind" IS NULL;
    ALTER TABLE "StockLedger" DROP COLUMN "reason";
    DO $$BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StockReason') THEN
        DROP TYPE "StockReason";
      END IF;
    END$$;
  END IF;
END$$;

-- Ensure kind is not null with default
UPDATE "StockLedger" SET "kind" = 'ADJUST' WHERE "kind" IS NULL;
ALTER TABLE "StockLedger" ALTER COLUMN "kind" SET NOT NULL;

-- StockSnapshot: add updatedAt
ALTER TABLE "StockSnapshot" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

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
    CREATE INDEX "StockReservation_tenant_orderLine_idx" ON "StockReservation"("tenantId","orderLineId");
    CREATE INDEX "StockReservation_tenant_wh_variant_idx" ON "StockReservation"("tenantId","warehouseId","variantId");
    CREATE UNIQUE INDEX "StockReservation_tenant_dedupe_key" ON "StockReservation"("tenantId","dedupeKey");
  END IF;
END$$;
