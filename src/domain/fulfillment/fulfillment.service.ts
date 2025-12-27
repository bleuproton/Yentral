// @ts-nocheck
import {
  Prisma,
  ReservationStatus,
  ReturnStatus,
  ShipmentStatus,
  StockLedgerKind
} from "@prisma/client";
import prisma from "@/lib/prisma";
import { StockLedgerRepository } from "../inventory/stock-ledger.repo";
import { StockSnapshotRepository } from "../inventory/stock-snapshot.repo";
import { StockReservationRepository } from "../inventory/stock-reservation.repo";

type ShipmentLineInput = {
  orderLineId: string;
  variantId: string;
  qty: number;
};

type ReturnLineInput = {
  orderLineId: string;
  variantId: string;
  qty: number;
  condition?: string | null;
};

export class FulfillmentService {
  async listShipments(tenantId: string) {
    return prisma.shipment.findMany({
      where: { tenantId },
      include: { lines: true },
      orderBy: { createdAt: "desc" },
      take: 50
    });
  }

  async listReturns(tenantId: string) {
    return prisma.return.findMany({
      where: { tenantId },
      include: { lines: true },
      orderBy: { createdAt: "desc" },
      take: 50
    });
  }

  async createShipment(input: {
    tenantId: string;
    orderId: string;
    warehouseId: string;
    lines: ShipmentLineInput[];
    meta?: Prisma.JsonValue | null;
    carrier?: string | null;
    trackingNo?: string | null;
    correlationId?: string | null;
  }) {
    const { tenantId, orderId, warehouseId, lines, meta, carrier, trackingNo, correlationId } = input;

    if (!lines.length) throw new Error("LINES_REQUIRED");

    return prisma.$transaction(async (tx) => {
      const [order, warehouse] = await Promise.all([
        tx.order.findFirst({ where: { id: orderId, tenantId } }),
        tx.warehouse.findFirst({ where: { id: warehouseId, tenantId } })
      ]);
      if (!order) throw new Error("ORDER_NOT_FOUND");
      if (!warehouse) throw new Error("WAREHOUSE_NOT_FOUND");

      const lineIds = lines.map((l) => l.orderLineId);
      const orderLines = await tx.orderLine.findMany({ where: { tenantId, orderId, id: { in: lineIds } } });
      const orderLineMap = new Map(orderLines.map((ol) => [ol.id, ol]));

      for (const line of lines) {
        const ol = orderLineMap.get(line.orderLineId);
        if (!ol) throw new Error(`ORDER_LINE_NOT_FOUND:${line.orderLineId}`);
        if (ol.variantId && ol.variantId !== line.variantId) {
          throw new Error(`VARIANT_MISMATCH:${line.orderLineId}`);
        }
      }

      const ledgerRepo = new StockLedgerRepository(tx);
      const snapshotRepo = new StockSnapshotRepository(tx);
      const reservationRepo = new StockReservationRepository(tx);

      const shipment = await tx.shipment.create({
        data: {
          tenantId,
          orderId,
          warehouseId,
          status: ShipmentStatus.CREATED,
          meta: meta ?? null,
          carrier: carrier ?? null,
          trackingNo: trackingNo ?? null
        }
      });

      for (const line of lines) {
        await tx.shipmentLine.create({
          data: {
            tenantId,
            shipmentId: shipment.id,
            orderLineId: line.orderLineId,
            variantId: line.variantId,
            qty: line.qty
          }
        });

        const reservations = await tx.stockReservation.findMany({
          where: {
            tenantId,
            orderLineId: line.orderLineId,
            warehouseId,
            variantId: line.variantId,
            status: ReservationStatus.ACTIVE
          },
          orderBy: { createdAt: "asc" }
        });

        const totalReserved = reservations.reduce((sum, r) => sum + r.qty, 0);
        if (totalReserved < line.qty) {
          throw new Error(`RESERVATION_SHORTAGE:${line.orderLineId}`);
        }

        let remaining = line.qty;
        for (const res of reservations) {
          if (remaining <= 0) break;
          if (res.qty > remaining) {
            throw new Error(`PARTIAL_RESERVATION_NOT_SUPPORTED:${line.orderLineId}`);
          }

          await reservationRepo.updateStatus(tenantId, res.id, ReservationStatus.CONSUMED);
          await ledgerRepo.append({
            tenantId,
            warehouseId,
            variantId: line.variantId,
            qtyDelta: -res.qty,
            kind: StockLedgerKind.SHIP,
            correlationId: correlationId ?? null,
            refType: "ShipmentLine",
            refId: line.orderLineId
          });
          await snapshotRepo.upsertAndApplyDelta(tenantId, warehouseId, line.variantId, -res.qty, -res.qty);
          remaining -= res.qty;
        }

        if (remaining > 0) {
          throw new Error(`RESERVATION_SHORTAGE:${line.orderLineId}`);
        }
      }

      return shipment;
    });
  }

  async confirmShipment(tenantId: string, shipmentId: string, data?: { trackingNo?: string | null; carrier?: string | null }) {
    const shipment = await prisma.shipment.findFirst({ where: { id: shipmentId, tenantId } });
    if (!shipment) throw new Error("SHIPMENT_NOT_FOUND");

    return prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: ShipmentStatus.SHIPPED,
        shippedAt: shipment.shippedAt ?? new Date(),
        trackingNo: data?.trackingNo ?? shipment.trackingNo,
        carrier: data?.carrier ?? shipment.carrier
      }
    });
  }

  async receiveReturn(input: {
    tenantId: string;
    orderId: string;
    warehouseId?: string;
    lines: ReturnLineInput[];
    reason?: string | null;
    meta?: Prisma.JsonValue | null;
  }) {
    const { tenantId, orderId, warehouseId, lines, reason, meta } = input;
    if (!lines.length) throw new Error("LINES_REQUIRED");

    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({ where: { id: orderId, tenantId } });
      if (!order) throw new Error("ORDER_NOT_FOUND");

      const derivedWarehouse =
        warehouseId ||
        (await tx.shipment.findFirst({ where: { tenantId, orderId }, orderBy: { createdAt: "asc" } }))?.warehouseId;
      if (!derivedWarehouse) throw new Error("WAREHOUSE_REQUIRED");

      const lineIds = lines.map((l) => l.orderLineId);
      const orderLines = await tx.orderLine.findMany({ where: { tenantId, orderId, id: { in: lineIds } } });
      const orderLineMap = new Map(orderLines.map((ol) => [ol.id, ol]));

      for (const line of lines) {
        const ol = orderLineMap.get(line.orderLineId);
        if (!ol) throw new Error(`ORDER_LINE_NOT_FOUND:${line.orderLineId}`);
        if (ol.variantId && ol.variantId !== line.variantId) {
          throw new Error(`VARIANT_MISMATCH:${line.orderLineId}`);
        }
      }

      const ledgerRepo = new StockLedgerRepository(tx);
      const snapshotRepo = new StockSnapshotRepository(tx);

      const ret = await tx.return.create({
        data: {
          tenantId,
          orderId,
          status: ReturnStatus.RECEIVED,
          reason: reason ?? null,
          meta: meta ?? null
        }
      });

      for (const line of lines) {
        await tx.returnLine.create({
          data: {
            tenantId,
            returnId: ret.id,
            orderLineId: line.orderLineId,
            variantId: line.variantId,
            qty: line.qty,
            condition: line.condition ?? null
          }
        });

        await ledgerRepo.append({
          tenantId,
          warehouseId: derivedWarehouse,
          variantId: line.variantId,
          qtyDelta: line.qty,
          kind: StockLedgerKind.RETURN,
          refType: "ReturnLine",
          refId: line.orderLineId
        });

        await snapshotRepo.upsertAndApplyDelta(tenantId, derivedWarehouse, line.variantId, line.qty, 0);
      }

      return ret;
    });
  }

  async receiveExistingReturn(tenantId: string, returnId: string, warehouseId?: string) {
    const ret = await prisma.return.findFirst({ where: { id: returnId, tenantId }, include: { lines: true } });
    if (!ret) throw new Error("RETURN_NOT_FOUND");
    if (ret.status === ReturnStatus.RECEIVED) return ret;

    const derivedWarehouse =
      warehouseId ||
      (await prisma.shipment.findFirst({ where: { tenantId, orderId: ret.orderId }, orderBy: { createdAt: "asc" } }))
        ?.warehouseId;
    if (!derivedWarehouse) throw new Error("WAREHOUSE_REQUIRED");

    return prisma.$transaction(async (tx) => {
      const ledgerRepo = new StockLedgerRepository(tx);
      const snapshotRepo = new StockSnapshotRepository(tx);

      for (const line of ret.lines) {
        await ledgerRepo.append({
          tenantId,
          warehouseId: derivedWarehouse,
          variantId: line.variantId,
          qtyDelta: line.qty,
          kind: StockLedgerKind.RETURN,
          refType: "ReturnLine",
          refId: line.orderLineId
        });

        await snapshotRepo.upsertAndApplyDelta(tenantId, derivedWarehouse, line.variantId, line.qty, 0);
      }

      return tx.return.update({
        where: { id: ret.id },
        data: { status: ReturnStatus.RECEIVED, receivedAt: new Date() }
      });
    });
  }
}
