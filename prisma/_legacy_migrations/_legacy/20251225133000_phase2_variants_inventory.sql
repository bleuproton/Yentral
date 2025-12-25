-- Phase 2: product variants and enterprise inventory (additive, non-breaking)

-- ProductVariant
CREATE TABLE "ProductVariant" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "ean" TEXT,
  "attributes" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductVariant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ProductVariant_tenantId_sku_key" ON "ProductVariant"("tenantId","sku");
CREATE INDEX "ProductVariant_tenantId_productId_idx" ON "ProductVariant"("tenantId","productId");

-- OrderLine: add variantId (nullable)
ALTER TABLE "OrderLine" ADD COLUMN "variantId" TEXT;
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- StockReason enum
DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StockReason') THEN
    CREATE TYPE "StockReason" AS ENUM ('RECEIPT','RESERVE','RELEASE','SHIP','RETURN','ADJUST');
  END IF;
END$$;

-- ReservationStatus enum
DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReservationStatus') THEN
    CREATE TYPE "ReservationStatus" AS ENUM ('ACTIVE','RELEASED','CONSUMED');
  END IF;
END$$;

-- StockLedger
CREATE TABLE "StockLedger" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "qtyDelta" INTEGER NOT NULL,
  "reason" "StockReason" NOT NULL,
  "refType" TEXT,
  "refId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockLedger_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StockLedger_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StockLedger_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "StockLedger_tenantId_wh_variant_idx" ON "StockLedger"("tenantId","warehouseId","variantId");

-- StockSnapshot
CREATE TABLE "StockSnapshot" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "onHand" INTEGER NOT NULL,
  "reserved" INTEGER NOT NULL,
  "available" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockSnapshot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StockSnapshot_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StockSnapshot_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "StockSnapshot_tenant_wh_variant_key" ON "StockSnapshot"("tenantId","warehouseId","variantId");

-- InventoryReservation
CREATE TABLE "InventoryReservation" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "orderLineId" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "qty" INTEGER NOT NULL,
  "status" "ReservationStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventoryReservation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "InventoryReservation_orderLineId_fkey" FOREIGN KEY ("orderLineId") REFERENCES "OrderLine"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "InventoryReservation_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "InventoryReservation_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "InventoryReservation_tenant_orderLine_idx" ON "InventoryReservation"("tenantId","orderLineId");
CREATE INDEX "InventoryReservation_tenant_wh_variant_idx" ON "InventoryReservation"("tenantId","warehouseId","variantId");
