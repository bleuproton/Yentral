-- Phase 2 (stock) patch: align stock models to StockLedgerKind, StockReservation, and snapshot updates.

-- Ensure StockLedgerKind enum exists
DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StockLedgerKind') THEN
    CREATE TYPE "StockLedgerKind" AS ENUM ('RECEIPT','RESERVE','RELEASE','SHIP','RETURN','ADJUST');
  END IF;
END$$;

-- Add columns to StockLedger
ALTER TABLE "StockLedger" ADD COLUMN IF NOT EXISTS "kind" "StockLedgerKind";
ALTER TABLE "StockLedger" ADD COLUMN IF NOT EXISTS "reason" TEXT;
ALTER TABLE "StockLedger" ADD COLUMN IF NOT EXISTS "correlationId" TEXT;

-- Convert reason column from enum StockReason to TEXT if needed
DO $$BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name='StockLedger' AND column_name='reason' AND udt_name='StockReason'
  ) THEN
    ALTER TABLE "StockLedger" ALTER COLUMN "reason" TYPE TEXT USING "reason"::text;
  END IF;
END$$;

-- Backfill kind from reason text when empty
UPDATE "StockLedger" SET "kind" = "reason"::text::"StockLedgerKind" WHERE "kind" IS NULL AND "reason" IS NOT NULL;
UPDATE "StockLedger" SET "kind" = 'ADJUST' WHERE "kind" IS NULL;
ALTER TABLE "StockLedger" ALTER COLUMN "kind" SET NOT NULL;

-- Drop StockReason type if unused
DO $$DECLARE
  cnt INTEGER;
BEGIN
  SELECT COUNT(*) INTO cnt
  FROM pg_type t
  JOIN pg_attribute a ON a.atttypid = t.oid
  WHERE t.typname = 'StockReason';
  IF cnt = 0 THEN
    DROP TYPE IF EXISTS "StockReason";
  END IF;
END$$;

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
