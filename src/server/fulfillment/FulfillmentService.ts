import { Prisma, ReservationStatus, ReturnStatus, ShipmentStatus, StockLedgerKind } from "@prisma/client";
import prisma from "@/server/db/prisma";
import { StockLedgerRepository } from "@/server/inventory/StockLedgerRepository";
import { StockSnapshotRepository } from "@/server/inventory/StockSnapshotRepository";
import { StockReservationRepository } from "@/server/inventory/StockReservationRepository";

type ShipmentLineInput = { orderLineId: string; variantId: string; qty: number };
type ReturnLineInput = { orderLineId: string; variantId: string; qty: number; condition?: string | null };

export class FulfillmentService {
  async createShipment(input: {
    tenantId: string;
    orderId: string;
    warehouseId: string;
    lines: ShipmentLineInput[];
    carrier?: string | null;
    trackingNo?: string | null;
    meta?: Prisma.JsonValue | null;
  }) {
    const { tenantId, orderId, warehouseId, lines, carrier, trackingNo, meta } = input;
    if (!lines.length) throw new Error("LINES_REQUIRED");

    return prisma.$transaction(async (tx) => {
      const [order, warehouse] = await Promise.all([
        tx.order.findFirst({ where: { tenantId, id: orderId } }),
        tx.warehouse.findFirst({ where: { tenantId, id: warehouseId } })
      ]);
      if (!order) throw new Error("ORDER_NOT_FOUND");
      if (!warehouse) throw new Error("WAREHOUSE_NOT_FOUND");

      const lineIds = lines.map((l) => l.orderLineId);
      const orderLines = await tx.orderLine.findMany({ where: { tenantId, orderId, id: { in: lineIds } } });
      const olMap = new Map(orderLines.map((ol) => [ol.id, ol]));

      for (const l of lines) {
        const ol = olMap.get(l.orderLineId);
        if (!ol) throw new Error(`ORDER_LINE_NOT_FOUND:${l.orderLineId}`);
        if (ol.variantId && ol.variantId !== l.variantId) throw new Error(`VARIANT_MISMATCH:${l.orderLineId}`);
      }

      const shipment = await tx.shipment.create({
        data: {
          tenantId,
          orderId,
          warehouseId,
          carrier: carrier ?? null,
          trackingNo: trackingNo ?? null,
          meta: meta ?? null,
          status: ShipmentStatus.CREATED
        }
      });

      for (const l of lines) {
        await tx.shipmentLine.create({
          data: {
            tenantId,
            shipmentId: shipment.id,
            orderLineId: l.orderLineId,
            variantId: l.variantId,
            qty: l.qty
          }
        });
      }

      return shipment;
    });
  }

  async markShipmentShipped(params: { tenantId: string; shipmentId: string; shippedAt?: Date | null }) {
    const { tenantId, shipmentId, shippedAt } = params;
    const ledgerRepo = new StockLedgerRepository();
    const snapshotRepo = new StockSnapshotRepository();
    const reservationRepo = new StockReservationRepository();

    return prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.findFirst({
        where: { tenantId, id: shipmentId },
        include: { lines: true }
      });
      if (!shipment) throw new Error("SHIPMENT_NOT_FOUND");

      for (const line of shipment.lines) {
        const reservation = await reservationRepo.getById(tenantId, line.orderLineId);
        // consume matching reservation if present for this line/variant/warehouse
        const activeRes = await tx.stockReservation.findFirst({
          where: {
            tenantId,
            orderLineId: line.orderLineId,
            variantId: line.variantId,
            warehouseId: shipment.warehouseId,
            status: ReservationStatus.ACTIVE
          },
          orderBy: { createdAt: "asc" }
        });

        const qtyToShip = line.qty;
        if (activeRes) {
          if (activeRes.qty !== qtyToShip) {
            throw new Error(`RESERVATION_QTY_MISMATCH:${line.orderLineId}`);
          }
          await reservationRepo.updateStatus(tenantId, activeRes.id, ReservationStatus.CONSUMED);
          await ledgerRepo.append({
            tenantId,
            warehouseId: shipment.warehouseId,
            variantId: line.variantId,
            qtyDelta: -qtyToShip,
            kind: StockLedgerKind.SHIP,
            refType: "ShipmentLine",
            refId: line.id
          });
          await snapshotRepo.upsertAndApplyDelta(
            tenantId,
            shipment.warehouseId,
            line.variantId,
            -qtyToShip,
            -qtyToShip
          );
        } else {
          await ledgerRepo.append({
            tenantId,
            warehouseId: shipment.warehouseId,
            variantId: line.variantId,
            qtyDelta: -qtyToShip,
            kind: StockLedgerKind.SHIP,
            refType: "ShipmentLine",
            refId: line.id
          });
          await snapshotRepo.upsertAndApplyDelta(tenantId, shipment.warehouseId, line.variantId, -qtyToShip, 0);
        }
      }

      return tx.shipment.update({
        where: { id: shipment.id },
        data: {
          status: ShipmentStatus.SHIPPED,
          shippedAt: shippedAt ?? new Date()
        }
      });
    });
  }

  async markShipmentDelivered(params: { tenantId: string; shipmentId: string; deliveredAt?: Date | null }) {
    const { tenantId, shipmentId, deliveredAt } = params;
    return prisma.shipment.updateMany({
      where: { tenantId, id: shipmentId },
      data: { status: ShipmentStatus.DELIVERED, deliveredAt: deliveredAt ?? new Date() }
    });
  }

  async createReturn(input: {
    tenantId: string;
    orderId: string;
    reason?: string | null;
    lines: ReturnLineInput[];
    meta?: Prisma.JsonValue | null;
  }) {
    const { tenantId, orderId, reason, lines, meta } = input;
    if (!lines.length) throw new Error("LINES_REQUIRED");

    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({ where: { tenantId, id: orderId } });
      if (!order) throw new Error("ORDER_NOT_FOUND");

      const olIds = lines.map((l) => l.orderLineId);
      const orderLines = await tx.orderLine.findMany({ where: { tenantId, orderId, id: { in: olIds } } });
      const olMap = new Map(orderLines.map((ol) => [ol.id, ol]));

      for (const l of lines) {
        const ol = olMap.get(l.orderLineId);
        if (!ol) throw new Error(`ORDER_LINE_NOT_FOUND:${l.orderLineId}`);
        if (ol.variantId && ol.variantId !== l.variantId) throw new Error(`VARIANT_MISMATCH:${l.orderLineId}`);
      }

      const ret = await tx.return.create({
        data: {
          tenantId,
          orderId,
          status: ReturnStatus.REQUESTED,
          reason: reason ?? null,
          meta: meta ?? null
        }
      });

      for (const l of lines) {
        await tx.returnLine.create({
          data: {
            tenantId,
            returnId: ret.id,
            orderLineId: l.orderLineId,
            variantId: l.variantId,
            qty: l.qty,
            condition: l.condition ?? null
          }
        });
      }

      return ret;
    });
  }

  async receiveReturn(params: { tenantId: string; returnId: string; receivedAt?: Date | null; warehouseId?: string | null }) {
    const { tenantId, returnId, receivedAt, warehouseId } = params;
    const ledgerRepo = new StockLedgerRepository();
    const snapshotRepo = new StockSnapshotRepository();

    return prisma.$transaction(async (tx) => {
      const ret = await tx.return.findFirst({
        where: { tenantId, id: returnId },
        include: { lines: true, order: true }
      });
      if (!ret) throw new Error("RETURN_NOT_FOUND");

      // resolve warehouse: provided or first shipment warehouse for the order
      const resolvedWarehouse =
        warehouseId ??
        (
          await tx.shipment.findFirst({
            where: { tenantId, orderId: ret.orderId },
            orderBy: { createdAt: "asc" }
          })
        )?.warehouseId;

      if (!resolvedWarehouse) throw new Error("WAREHOUSE_REQUIRED");

      for (const line of ret.lines) {
        await ledgerRepo.append({
          tenantId,
          warehouseId: resolvedWarehouse,
          variantId: line.variantId,
          qtyDelta: line.qty,
          kind: StockLedgerKind.RETURN,
          refType: "ReturnLine",
          refId: line.id
        });
        await snapshotRepo.upsertAndApplyDelta(tenantId, resolvedWarehouse, line.variantId, line.qty, 0);
      }

      return tx.return.update({
        where: { id: ret.id },
        data: { status: ReturnStatus.RECEIVED, receivedAt: receivedAt ?? new Date() }
      });
    });
  }
}
