// @ts-nocheck
import { StockLedgerKind, ReservationStatus } from "@prisma/client";

export type AdjustStockInput = {
  tenantId: string;
  warehouseId: string;
  variantId: string;
  qtyDelta: number;
  kind: StockLedgerKind;
  reason?: string | null;
  correlationId?: string | null;
  refType?: string | null;
  refId?: string | null;
};

export type ReserveStockInput = {
  tenantId: string;
  orderLineId: string;
  warehouseId: string;
  variantId: string;
  qty: number;
  dedupeKey?: string | null;
  correlationId?: string | null;
};

export type ReservationStatusUpdate = ReservationStatus;

export { StockLedgerKind, ReservationStatus };
