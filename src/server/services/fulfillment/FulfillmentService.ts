// @ts-nocheck
import { ReservationStatus, ShipmentStatus, StockLedgerKind } from "@prisma/client";
import prisma from "@/server/db/prisma";
import { StockService } from "@/server/services/inventory/StockService";
import { ReservationService } from "@/server/services/inventory/ReservationService";

type ShipmentLineInput = { orderLineId: string; qty: number };

export class FulfillmentService {
  async createShipment(tenantId: string, input: { orderId: string; warehouseId: string; lines: ShipmentLineInput[]; carrier?: string | null; trackingNo?: string | null }) {
    const { orderId, warehouseId, lines, carrier, trackingNo } = input;
    if (!lines.length) throw new Error("LINES_REQUIRED");

    return prisma.$transaction(async (tx) => {
      const [order, warehouse] = await Promise.all([
        tx.order.findFirst({ where: { tenantId, id: orderId } }),
        tx.warehouse.findFirst({ where: { tenantId, id: warehouseId } })
      ]);
      if (!order) throw new Error("ORDER_NOT_FOUND");
      if (!warehouse) throw new Error("WAREHOUSE_NOT_FOUND");

      const orderLineIds = lines.map((l) => l.orderLineId);
      const orderLines = await tx.orderLine.findMany({ where: { tenantId, orderId, id: { in: orderLineIds } } });
      const olMap = new Map(orderLines.map((ol) => [ol.id, ol]));
      for (const l of lines) {
        const ol = olMap.get(l.orderLineId);
        if (!ol) throw new Error(`ORDER_LINE_NOT_FOUND:${l.orderLineId}`);
        if (!ol.variantId) throw new Error(`ORDER_LINE_VARIANT_MISSING:${l.orderLineId}`);
        if (l.qty <= 0) throw new Error(`INVALID_QTY:${l.orderLineId}`);
      }

      const shipment = await tx.shipment.create({
        data: {
          tenantId,
          orderId,
          warehouseId,
          carrier: carrier ?? null,
          trackingNo: trackingNo ?? null,
          status: ShipmentStatus.CREATED
        }
      });

      for (const l of lines) {
        const variantId = olMap.get(l.orderLineId)!.variantId!;
        await tx.shipmentLine.create({
          data: {
            tenantId,
            shipmentId: shipment.id,
            orderLineId: l.orderLineId,
            variantId,
            qty: l.qty
          }
        });
      }

      return tx.shipment.findFirst({ where: { tenantId, id: shipment.id }, include: { lines: true } });
    });
  }

  async markShipmentShipped(tenantId: string, input: { shipmentId: string; shippedAt?: Date | null; correlationId?: string | null }) {
    const { shipmentId, shippedAt, correlationId } = input;

    return prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.findFirst({
        where: { tenantId, id: shipmentId },
        include: { lines: true }
      });
      if (!shipment) throw new Error("SHIPMENT_NOT_FOUND");
      if (shipment.status === ShipmentStatus.SHIPPED || shipment.status === ShipmentStatus.DELIVERED) {
        throw new Error("SHIPMENT_ALREADY_SHIPPED");
      }

      const stock = new StockService(tx);
      const reservations = new ReservationService(tx, stock);

      for (const line of shipment.lines) {
        // validate reservation availability
        const activeList = await tx.stockReservation.findMany({
          where: {
            tenantId,
            orderLineId: line.orderLineId,
            warehouseId: shipment.warehouseId,
            variantId: line.variantId,
            status: ReservationStatus.ACTIVE
          },
          orderBy: { createdAt: "asc" }
        });
        const total = activeList.reduce((sum, r) => sum + r.qty, 0);
        if (total < line.qty) throw new Error(`RESERVATION_SHORTAGE:${line.orderLineId}`);

        await reservations.consumeActiveReservationsExactOrSplit({
          tenantId,
          orderLineId: line.orderLineId,
          warehouseId: shipment.warehouseId,
          variantId: line.variantId,
          qtyToConsume: line.qty
        });

        // stock movement: onHand-qty, reserved-qty, available stays in sync
        await stock.applySnapshotDelta(tenantId, shipment.warehouseId, line.variantId, -line.qty, -line.qty);
        await stock.ledger({
          tenantId,
          warehouseId: shipment.warehouseId,
          variantId: line.variantId,
          qtyDelta: -line.qty,
          kind: StockLedgerKind.SHIP,
          reason: "FULFILLMENT",
          refType: "Shipment",
          refId: shipment.id,
          correlationId: correlationId ?? null
        });
      }

      return tx.shipment.update({
        where: { id: shipment.id },
        data: {
          status: ShipmentStatus.SHIPPED,
          shippedAt: shippedAt ?? new Date()
        },
        include: { lines: true }
      });
    });
  }

  async markShipmentDelivered(tenantId: string, shipmentId: string, deliveredAt?: Date | null) {
    return prisma.shipment.updateMany({
      where: { tenantId, id: shipmentId },
      data: { status: ShipmentStatus.DELIVERED, deliveredAt: deliveredAt ?? new Date() }
    });
  }

  async cancelShipment(tenantId: string, shipmentId: string, reason?: string | null) {
    return prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.findFirst({ where: { tenantId, id: shipmentId }, include: { lines: true } });
      if (!shipment) throw new Error("SHIPMENT_NOT_FOUND");
      if (![ShipmentStatus.CREATED, ShipmentStatus.LABEL_PURCHASED].includes(shipment.status)) {
        throw new Error("CANNOT_CANCEL");
      }

      const stock = new StockService(tx);
      const linesGrouped = shipment.lines.map((l) => ({
        orderLineId: l.orderLineId,
        variantId: l.variantId,
        qty: l.qty
      }));

      for (const line of linesGrouped) {
        const actives = await tx.stockReservation.findMany({
          where: {
            tenantId,
            orderLineId: line.orderLineId,
            variantId: line.variantId,
            warehouseId: shipment.warehouseId,
            status: ReservationStatus.ACTIVE
          },
          orderBy: { createdAt: "asc" }
        });
        let remaining = line.qty;
        for (const res of actives) {
          if (remaining <= 0) break;
          const releaseQty = Math.min(remaining, res.qty);
          await tx.stockReservation.updateMany({
            where: { tenantId, id: res.id },
            data: { status: ReservationStatus.RELEASED, qty: releaseQty }
          });
          await stock.applySnapshotDelta(tenantId, shipment.warehouseId, line.variantId, 0, -releaseQty);
          await stock.ledger({
            tenantId,
            warehouseId: shipment.warehouseId,
            variantId: line.variantId,
            qtyDelta: 0,
            kind: StockLedgerKind.RELEASE,
            reason: reason ?? "CANCEL_SHIPMENT",
            refType: "Shipment",
            refId: shipment.id
          });
          remaining -= releaseQty;
        }
      }

      return tx.shipment.update({
        where: { id: shipment.id },
        data: { status: ShipmentStatus.CANCELLED }
      });
    });
  }
}
