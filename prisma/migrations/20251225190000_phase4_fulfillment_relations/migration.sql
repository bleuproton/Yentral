-- CreateIndex
CREATE UNIQUE INDEX "ReturnLine_tenantId_id_key" ON "ReturnLine"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ShipmentLine_tenantId_id_key" ON "ShipmentLine"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "StockReservation_tenantId_id_key" ON "StockReservation"("tenantId", "id");
