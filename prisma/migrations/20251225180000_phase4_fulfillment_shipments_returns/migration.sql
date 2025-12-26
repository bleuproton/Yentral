-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('CREATED', 'LABEL_PURCHASED', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'APPROVED', 'RECEIVED', 'REFUNDED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "OrderLine" DROP CONSTRAINT "OrderLine_variantId_fkey";

-- DropForeignKey
ALTER TABLE "StockReservation" DROP CONSTRAINT IF EXISTS "StockReservation_orderLineId_fkey";

-- DropForeignKey
ALTER TABLE "StockReservation" DROP CONSTRAINT IF EXISTS "StockReservation_variantId_fkey";

-- DropForeignKey
ALTER TABLE "StockReservation" DROP CONSTRAINT IF EXISTS "StockReservation_warehouseId_fkey";

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'CREATED',
    "carrier" TEXT,
    "trackingNo" TEXT,
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentLine" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "orderLineId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Return" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT,
    "receivedAt" TIMESTAMP(3),
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Return_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnLine" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "orderLineId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "condition" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReturnLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Shipment_tenantId_orderId_idx" ON "Shipment"("tenantId", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_tenantId_id_key" ON "Shipment"("tenantId", "id");

-- CreateIndex
CREATE INDEX "ShipmentLine_tenantId_shipmentId_idx" ON "ShipmentLine"("tenantId", "shipmentId");

-- CreateIndex
CREATE INDEX "Return_tenantId_orderId_idx" ON "Return"("tenantId", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Return_tenantId_id_key" ON "Return"("tenantId", "id");

-- CreateIndex
CREATE INDEX "ReturnLine_tenantId_returnId_idx" ON "ReturnLine"("tenantId", "returnId");

-- RenameForeignKey
ALTER TABLE "ChannelOrder" RENAME CONSTRAINT "ChannelOrder_connectionId_fkey" TO "ChannelOrder_tenantId_connectionId_fkey";

-- RenameForeignKey
ALTER TABLE "ChannelOrder" RENAME CONSTRAINT "ChannelOrder_orderId_fkey" TO "ChannelOrder_tenantId_orderId_fkey";

-- RenameForeignKey
ALTER TABLE "ChannelProduct" RENAME CONSTRAINT "ChannelProduct_connectionId_fkey" TO "ChannelProduct_tenantId_connectionId_fkey";

-- RenameForeignKey
ALTER TABLE "ChannelProduct" RENAME CONSTRAINT "ChannelProduct_productId_fkey" TO "ChannelProduct_tenantId_productId_fkey";

-- RenameForeignKey
ALTER TABLE "ChannelVariant" RENAME CONSTRAINT "ChannelVariant_connectionId_fkey" TO "ChannelVariant_tenantId_connectionId_fkey";

-- RenameForeignKey
ALTER TABLE "ChannelVariant" RENAME CONSTRAINT "ChannelVariant_variantId_fkey" TO "ChannelVariant_tenantId_variantId_fkey";

-- RenameForeignKey
ALTER TABLE "InventoryItem" RENAME CONSTRAINT "InventoryItem_productId_fkey" TO "InventoryItem_tenantId_productId_fkey";

-- RenameForeignKey
ALTER TABLE "OrderLine" RENAME CONSTRAINT "OrderLine_orderId_fkey" TO "OrderLine_tenantId_orderId_fkey";

-- RenameForeignKey
ALTER TABLE "OrderLine" RENAME CONSTRAINT "OrderLine_productId_fkey" TO "OrderLine_tenantId_productId_fkey";

-- RenameForeignKey
ALTER TABLE "ProductVariant" RENAME CONSTRAINT "ProductVariant_productId_fkey" TO "ProductVariant_tenantId_productId_fkey";

-- RenameForeignKey
ALTER TABLE "StockLedger" RENAME CONSTRAINT "StockLedger_variantId_fkey" TO "StockLedger_tenantId_variantId_fkey";

-- RenameForeignKey
ALTER TABLE "StockLedger" RENAME CONSTRAINT "StockLedger_warehouseId_fkey" TO "StockLedger_tenantId_warehouseId_fkey";

-- RenameForeignKey
ALTER TABLE "StockSnapshot" RENAME CONSTRAINT "StockSnapshot_variantId_fkey" TO "StockSnapshot_tenantId_variantId_fkey";

-- RenameForeignKey
ALTER TABLE "StockSnapshot" RENAME CONSTRAINT "StockSnapshot_warehouseId_fkey" TO "StockSnapshot_tenantId_warehouseId_fkey";

-- RenameForeignKey
ALTER TABLE "WarehouseMapping" RENAME CONSTRAINT "WarehouseMapping_connectionId_fkey" TO "WarehouseMapping_tenantId_connectionId_fkey";

-- RenameForeignKey
ALTER TABLE "WarehouseMapping" RENAME CONSTRAINT "WarehouseMapping_warehouseId_fkey" TO "WarehouseMapping_tenantId_warehouseId_fkey";

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_tenantId_variantId_fkey" FOREIGN KEY ("tenantId", "variantId") REFERENCES "ProductVariant"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_tenantId_orderId_fkey" FOREIGN KEY ("tenantId", "orderId") REFERENCES "Order"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_tenantId_warehouseId_fkey" FOREIGN KEY ("tenantId", "warehouseId") REFERENCES "Warehouse"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentLine" ADD CONSTRAINT "ShipmentLine_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentLine" ADD CONSTRAINT "ShipmentLine_tenantId_shipmentId_fkey" FOREIGN KEY ("tenantId", "shipmentId") REFERENCES "Shipment"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentLine" ADD CONSTRAINT "ShipmentLine_tenantId_orderLineId_fkey" FOREIGN KEY ("tenantId", "orderLineId") REFERENCES "OrderLine"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentLine" ADD CONSTRAINT "ShipmentLine_tenantId_variantId_fkey" FOREIGN KEY ("tenantId", "variantId") REFERENCES "ProductVariant"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Return" ADD CONSTRAINT "Return_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Return" ADD CONSTRAINT "Return_tenantId_orderId_fkey" FOREIGN KEY ("tenantId", "orderId") REFERENCES "Order"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnLine" ADD CONSTRAINT "ReturnLine_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnLine" ADD CONSTRAINT "ReturnLine_tenantId_returnId_fkey" FOREIGN KEY ("tenantId", "returnId") REFERENCES "Return"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnLine" ADD CONSTRAINT "ReturnLine_tenantId_orderLineId_fkey" FOREIGN KEY ("tenantId", "orderLineId") REFERENCES "OrderLine"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnLine" ADD CONSTRAINT "ReturnLine_tenantId_variantId_fkey" FOREIGN KEY ("tenantId", "variantId") REFERENCES "ProductVariant"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Tenant-safe StockReservation FKs
ALTER TABLE "StockReservation" DROP CONSTRAINT IF EXISTS "StockReservation_orderLineId_fkey";
ALTER TABLE "StockReservation" DROP CONSTRAINT IF EXISTS "StockReservation_warehouseId_fkey";
ALTER TABLE "StockReservation" DROP CONSTRAINT IF EXISTS "StockReservation_variantId_fkey";
ALTER TABLE "StockReservation" DROP CONSTRAINT IF EXISTS "StockReservation_tenantId_orderLineId_fkey";
ALTER TABLE "StockReservation" DROP CONSTRAINT IF EXISTS "StockReservation_tenantId_warehouseId_fkey";
ALTER TABLE "StockReservation" DROP CONSTRAINT IF EXISTS "StockReservation_tenantId_variantId_fkey";

ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_tenantId_orderLineId_fkey"
  FOREIGN KEY ("tenantId", "orderLineId") REFERENCES "OrderLine"("tenantId", "id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_tenantId_warehouseId_fkey"
  FOREIGN KEY ("tenantId", "warehouseId") REFERENCES "Warehouse"("tenantId", "id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_tenantId_variantId_fkey"
  FOREIGN KEY ("tenantId", "variantId") REFERENCES "ProductVariant"("tenantId", "id")
  ON DELETE CASCADE ON UPDATE CASCADE;
