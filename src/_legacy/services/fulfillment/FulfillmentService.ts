import {
  AuditEvent,
  ReservationStatus,
  ShipmentStatus,
  StockLedgerKind
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { StockService } from "@/server/services/inventory/StockService";
import { ReservationService } from "@/server/services/inventory/ReservationService";

type ShipmentLineInput = { orderLineId: string; variantId: string; qty: number };

export class FulfillmentService {
  private async audit(tenantId: string, actorUserId: string | null, action: string, resourceId: string) {
    await prisma.auditEvent.create({
      data: {
        tenantId,
        actorUserId,
        action,
        resourceType: "Shipment",
        resourceId
      }
    });
  }

  async createShipment(
    tenantId: string,
    actorUserId: string | null,
    input: { orderId: string; warehouseId: string; carrier?: string | null; trackingNo?: string | null; lines: ShipmentLineInput[] }
  ) {
    const { orderId, warehouseId, carrier, trackingNo, lines } = input;
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

      const stock = new StockService(tx);
      const reservations = new ReservationService(tx, stock);

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

        // consume reservations and move stock
        await reservations.consumeActiveReservationsExactOrSplit({
          tenantId,
          orderLineId: l.orderLineId,
          warehouseId,
          variantId,
          qtyToConsume: l.qty
        });
        await stock.applySnapshotDelta(tenantId, warehouseId, variantId, -l.qty, -l.qty);
        await stock.ledger({
          tenantId,
          warehouseId,
          variantId,
          qtyDelta: -l.qty,
          kind: StockLedgerKind.SHIP,
          reason: "FULFILLMENT",
          refType: "Shipment",
          refId: shipment.id
        });
      }

      await this.audit(tenantId, actorUserId, "SHIPMENT_CREATED", shipment.id);

      return tx.shipment.findFirst({ where: { tenantId, id: shipment.id }, include: { lines: true } });
    });
  }

  async markShipmentShipped(
    tenantId: string,
    actorUserId: string | null,
    shipmentId: string,
    data?: { shippedAt?: Date | null; carrier?: string | null; trackingNo?: string | null }
  ) {
    const { shippedAt, carrier, trackingNo } = data || {};
    const result = await prisma.shipment.updateMany({
      where: { tenantId, id: shipmentId },
      data: {
        status: ShipmentStatus.SHIPPED,
        shippedAt: shippedAt ?? new Date(),
        carrier: carrier ?? undefined,
        trackingNo: trackingNo ?? undefined
      }
    });
    if (result.count === 0) throw new Error("SHIPMENT_NOT_FOUND");
    await this.audit(tenantId, actorUserId, "SHIPMENT_SHIPPED", shipmentId);
    return prisma.shipment.findFirst({ where: { tenantId, id: shipmentId }, include: { lines: true } });
  }

  async markShipmentDelivered(
    tenantId: string,
    actorUserId: string | null,
    shipmentId: string,
    data?: { deliveredAt?: Date | null }
  ) {
    const { deliveredAt } = data || {};
    const result = await prisma.shipment.updateMany({
      where: { tenantId, id: shipmentId },
      data: { status: ShipmentStatus.DELIVERED, deliveredAt: deliveredAt ?? new Date() }
    });
    if (result.count === 0) throw new Error("SHIPMENT_NOT_FOUND");
    await this.audit(tenantId, actorUserId, "SHIPMENT_DELIVERED", shipmentId);
    return prisma.shipment.findFirst({ where: { tenantId, id: shipmentId }, include: { lines: true } });
  }

  async cancelShipment(
    tenantId: string,
    actorUserId: string | null,
    shipmentId: string,
    data?: { reason?: string | null }
  ) {
    const shipment = await prisma.shipment.findFirst({ where: { tenantId, id: shipmentId }, include: { lines: true } });
    if (!shipment) throw new Error("SHIPMENT_NOT_FOUND");
    if (![ShipmentStatus.CREATED, ShipmentStatus.LABEL_PURCHASED].includes(shipment.status)) {
      throw new Error("CANNOT_CANCEL");
    }

      await prisma.$transaction(async (tx) => {
        const sStock = new StockService(tx);
        for (const line of shipment.lines) {
          // reverse shipped effect: restore stock and release reservations
          const active = await tx.stockReservation.findMany({
            where: {
              tenantId,
              orderLineId: line.orderLineId,
              variantId: line.variantId,
              warehouseId: shipment.warehouseId,
              status: ReservationStatus.ACTIVE
            }
          });
          let remaining = line.qty;
          for (const res of active) {
            if (remaining <= 0) break;
            const releaseQty = Math.min(remaining, res.qty);
            await tx.stockReservation.updateMany({
              where: { tenantId, id: res.id },
              data: { status: ReservationStatus.RELEASED, qty: releaseQty }
            });
            await sStock.applySnapshotDelta(tenantId, shipment.warehouseId, line.variantId, releaseQty, releaseQty);
            await sStock.ledger({
              tenantId,
              warehouseId: shipment.warehouseId,
              variantId: line.variantId,
              qtyDelta: releaseQty,
              kind: StockLedgerKind.ADJUST,
            reason: data?.reason ?? "CANCEL_SHIPMENT",
            refType: "Shipment",
            refId: shipment.id
          });
          remaining -= releaseQty;
        }
      }

      await tx.shipment.update({
        where: { id: shipment.id },
        data: { status: ShipmentStatus.CANCELLED }
      });
    });

    await this.audit(tenantId, actorUserId, "SHIPMENT_CANCELLED", shipmentId);
    return prisma.shipment.findFirst({ where: { tenantId, id: shipmentId }, include: { lines: true } });
  }
}
