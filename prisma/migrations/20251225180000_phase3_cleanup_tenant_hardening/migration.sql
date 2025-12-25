-- Phase 3.1 cleanup: tenant hardening, composite FKs, stock cleanup, and legacy reservation removal.

-- Drop or rename legacy InventoryReservation
DO $$DECLARE
  cnt INTEGER;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='InventoryReservation'
  ) THEN
    SELECT COUNT(*) INTO cnt FROM "InventoryReservation";
    IF cnt = 0 THEN
      EXECUTE 'DROP TABLE "InventoryReservation"';
    ELSE
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='InventoryReservation_Legacy'
      ) THEN
        EXECUTE 'ALTER TABLE "InventoryReservation" RENAME TO "InventoryReservation_Legacy"';
      END IF;
    END IF;
  END IF;
END$$;

-- Ensure StockLedgerKind exists
DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StockLedgerKind') THEN
    CREATE TYPE "StockLedgerKind" AS ENUM ('RECEIPT','RESERVE','RELEASE','SHIP','RETURN','ADJUST');
  END IF;
END$$;

-- StockLedger column alignment
ALTER TABLE "StockLedger" ADD COLUMN IF NOT EXISTS "kind" "StockLedgerKind";
ALTER TABLE "StockLedger" ADD COLUMN IF NOT EXISTS "reason" TEXT;
ALTER TABLE "StockLedger" ADD COLUMN IF NOT EXISTS "correlationId" TEXT;

-- Convert reason from enum StockReason to TEXT if still present
DO $$BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='StockLedger' AND column_name='reason' AND udt_name='StockReason'
  ) THEN
    ALTER TABLE "StockLedger" ALTER COLUMN "reason" TYPE TEXT USING "reason"::text;
  END IF;
END$$;

-- Backfill kind from reason text when missing
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

-- Ensure StockSnapshot.updatedAt exists and align updatedAt defaults
ALTER TABLE "StockSnapshot" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "StockSnapshot" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "StockReservation" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "ChannelProduct" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "ChannelVariant" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "ChannelOrder" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "IntegrationConnection" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "WarehouseMapping" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "ProductVariant" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- Composite tenant-safe uniques for FK targets
CREATE UNIQUE INDEX IF NOT EXISTS "Product_tenantId_id_key" ON "Product"("tenantId","id");
CREATE UNIQUE INDEX IF NOT EXISTS "Order_tenantId_id_key" ON "Order"("tenantId","id");
CREATE UNIQUE INDEX IF NOT EXISTS "Warehouse_tenantId_id_key" ON "Warehouse"("tenantId","id");
CREATE UNIQUE INDEX IF NOT EXISTS "ProductVariant_tenantId_id_key" ON "ProductVariant"("tenantId","id");
CREATE UNIQUE INDEX IF NOT EXISTS "IntegrationConnection_tenantId_id_key" ON "IntegrationConnection"("tenantId","id");
CREATE UNIQUE INDEX IF NOT EXISTS "OrderLine_tenantId_id_key" ON "OrderLine"("tenantId","id");

-- Drop legacy FKs before re-adding composite FKs
ALTER TABLE "ProductVariant" DROP CONSTRAINT IF EXISTS "ProductVariant_productId_fkey";
ALTER TABLE "InventoryItem" DROP CONSTRAINT IF EXISTS "InventoryItem_productId_fkey";
ALTER TABLE "OrderLine" DROP CONSTRAINT IF EXISTS "OrderLine_orderId_fkey";
ALTER TABLE "OrderLine" DROP CONSTRAINT IF EXISTS "OrderLine_productId_fkey";
ALTER TABLE "OrderLine" DROP CONSTRAINT IF EXISTS "OrderLine_variantId_fkey";
ALTER TABLE "StockLedger" DROP CONSTRAINT IF EXISTS "StockLedger_warehouseId_fkey";
ALTER TABLE "StockLedger" DROP CONSTRAINT IF EXISTS "StockLedger_variantId_fkey";
ALTER TABLE "StockSnapshot" DROP CONSTRAINT IF EXISTS "StockSnapshot_warehouseId_fkey";
ALTER TABLE "StockSnapshot" DROP CONSTRAINT IF EXISTS "StockSnapshot_variantId_fkey";
ALTER TABLE "StockReservation" DROP CONSTRAINT IF EXISTS "StockReservation_orderLineId_fkey";
ALTER TABLE "StockReservation" DROP CONSTRAINT IF EXISTS "StockReservation_warehouseId_fkey";
ALTER TABLE "StockReservation" DROP CONSTRAINT IF EXISTS "StockReservation_variantId_fkey";
ALTER TABLE "WarehouseMapping" DROP CONSTRAINT IF EXISTS "WarehouseMapping_connectionId_fkey";
ALTER TABLE "WarehouseMapping" DROP CONSTRAINT IF EXISTS "WarehouseMapping_warehouseId_fkey";
ALTER TABLE "ChannelProduct" DROP CONSTRAINT IF EXISTS "ChannelProduct_connectionId_fkey";
ALTER TABLE "ChannelProduct" DROP CONSTRAINT IF EXISTS "ChannelProduct_productId_fkey";
ALTER TABLE "ChannelVariant" DROP CONSTRAINT IF EXISTS "ChannelVariant_connectionId_fkey";
ALTER TABLE "ChannelVariant" DROP CONSTRAINT IF EXISTS "ChannelVariant_variantId_fkey";
ALTER TABLE "ChannelOrder" DROP CONSTRAINT IF EXISTS "ChannelOrder_connectionId_fkey";
ALTER TABLE "ChannelOrder" DROP CONSTRAINT IF EXISTS "ChannelOrder_orderId_fkey";

-- Recreate composite FKs with tenant guards
ALTER TABLE "ProductVariant"
  ADD CONSTRAINT "ProductVariant_productId_fkey"
  FOREIGN KEY ("tenantId","productId") REFERENCES "Product"("tenantId","id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InventoryItem"
  ADD CONSTRAINT "InventoryItem_productId_fkey"
  FOREIGN KEY ("tenantId","productId") REFERENCES "Product"("tenantId","id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderLine"
  ADD CONSTRAINT "OrderLine_orderId_fkey"
  FOREIGN KEY ("tenantId","orderId") REFERENCES "Order"("tenantId","id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "OrderLine_productId_fkey"
  FOREIGN KEY ("tenantId","productId") REFERENCES "Product"("tenantId","id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "OrderLine_variantId_fkey"
  FOREIGN KEY ("tenantId","variantId") REFERENCES "ProductVariant"("tenantId","id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StockLedger"
  ADD CONSTRAINT "StockLedger_warehouseId_fkey"
  FOREIGN KEY ("tenantId","warehouseId") REFERENCES "Warehouse"("tenantId","id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "StockLedger_variantId_fkey"
  FOREIGN KEY ("tenantId","variantId") REFERENCES "ProductVariant"("tenantId","id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StockSnapshot"
  ADD CONSTRAINT "StockSnapshot_warehouseId_fkey"
  FOREIGN KEY ("tenantId","warehouseId") REFERENCES "Warehouse"("tenantId","id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "StockSnapshot_variantId_fkey"
  FOREIGN KEY ("tenantId","variantId") REFERENCES "ProductVariant"("tenantId","id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StockReservation"
  ADD CONSTRAINT "StockReservation_orderLineId_fkey"
  FOREIGN KEY ("tenantId","orderLineId") REFERENCES "OrderLine"("tenantId","id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "StockReservation_warehouseId_fkey"
  FOREIGN KEY ("tenantId","warehouseId") REFERENCES "Warehouse"("tenantId","id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "StockReservation_variantId_fkey"
  FOREIGN KEY ("tenantId","variantId") REFERENCES "ProductVariant"("tenantId","id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WarehouseMapping"
  ADD CONSTRAINT "WarehouseMapping_connectionId_fkey"
  FOREIGN KEY ("tenantId","connectionId") REFERENCES "IntegrationConnection"("tenantId","id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "WarehouseMapping_warehouseId_fkey"
  FOREIGN KEY ("tenantId","warehouseId") REFERENCES "Warehouse"("tenantId","id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChannelProduct"
  ADD CONSTRAINT "ChannelProduct_connectionId_fkey"
  FOREIGN KEY ("tenantId","connectionId") REFERENCES "IntegrationConnection"("tenantId","id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ChannelProduct_productId_fkey"
  FOREIGN KEY ("tenantId","productId") REFERENCES "Product"("tenantId","id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ChannelVariant"
  ADD CONSTRAINT "ChannelVariant_connectionId_fkey"
  FOREIGN KEY ("tenantId","connectionId") REFERENCES "IntegrationConnection"("tenantId","id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ChannelVariant_variantId_fkey"
  FOREIGN KEY ("tenantId","variantId") REFERENCES "ProductVariant"("tenantId","id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ChannelOrder"
  ADD CONSTRAINT "ChannelOrder_connectionId_fkey"
  FOREIGN KEY ("tenantId","connectionId") REFERENCES "IntegrationConnection"("tenantId","id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ChannelOrder_orderId_fkey"
  FOREIGN KEY ("tenantId","orderId") REFERENCES "Order"("tenantId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
