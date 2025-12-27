// @ts-nocheck
import { ReturnStatus, StockLedgerKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { StockService } from "@/server/services/inventory/StockService";

type ReturnLineInput = { orderLineId: string; variantId: string; qty: number; condition?: string | null };

export class ReturnsService {
  private async audit(tenantId: string, actorUserId: string | null, action: string, resourceId: string) {
    await prisma.auditEvent.create({
      data: {
        tenantId,
        actorUserId,
        action,
        resourceType: "Return",
        resourceId
      }
    });
  }

  async createReturn(
    tenantId: string,
    actorUserId: string | null,
    input: { orderId: string; reason?: string | null; lines: ReturnLineInput[] }
  ) {
    const { orderId, reason, lines } = input;
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
        if (!ol.variantId) throw new Error(`ORDER_LINE_VARIANT_MISSING:${l.orderLineId}`);
        if (l.qty <= 0) throw new Error(`INVALID_QTY:${l.orderLineId}`);
      }

      const ret = await tx.return.create({
        data: { tenantId, orderId, status: ReturnStatus.REQUESTED, reason: reason ?? null }
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

      await this.audit(tenantId, actorUserId, "RETURN_CREATED", ret.id);
      return tx.return.findFirst({ where: { tenantId, id: ret.id }, include: { lines: true } });
    });
  }

  async approveReturn(tenantId: string, actorUserId: string | null, returnId: string) {
    const res = await prisma.return.updateMany({
      where: { tenantId, id: returnId },
      data: { status: ReturnStatus.APPROVED }
    });
    if (res.count === 0) throw new Error("RETURN_NOT_FOUND");
    await this.audit(tenantId, actorUserId, "RETURN_APPROVED", returnId);
    return prisma.return.findFirst({ where: { tenantId, id: returnId }, include: { lines: true } });
  }

  async receiveReturn(
    tenantId: string,
    actorUserId: string | null,
    input: { returnId: string; restockWarehouseId?: string | null; receivedAt?: Date | null }
  ) {
    const { returnId, restockWarehouseId, receivedAt } = input;

    return prisma.$transaction(async (tx) => {
      const ret = await tx.return.findFirst({ where: { tenantId, id: returnId }, include: { lines: true } });
      if (!ret) throw new Error("RETURN_NOT_FOUND");

      if (restockWarehouseId) {
        const warehouse = await tx.warehouse.findFirst({ where: { tenantId, id: restockWarehouseId } });
        if (!warehouse) throw new Error("WAREHOUSE_NOT_FOUND");
        const stock = new StockService(tx);
        for (const line of ret.lines) {
          await stock.applySnapshotDelta(tenantId, restockWarehouseId, line.variantId, line.qty, 0);
          await stock.ledger({
            tenantId,
            warehouseId: restockWarehouseId,
            variantId: line.variantId,
            qtyDelta: line.qty,
            kind: StockLedgerKind.RETURN,
            reason: "RETURN_RECEIVED",
            refType: "Return",
            refId: ret.id
          });
        }
      }

      const updated = await tx.return.update({
        where: { id: ret.id },
        data: { status: ReturnStatus.RECEIVED, receivedAt: receivedAt ?? new Date() }
      });

      await this.audit(tenantId, actorUserId, "RETURN_RECEIVED", returnId);
      return updated;
    });
  }

  async refundReturn(tenantId: string, actorUserId: string | null, returnId: string) {
    const res = await prisma.return.updateMany({
      where: { tenantId, id: returnId },
      data: { status: ReturnStatus.REFUNDED }
    });
    if (res.count === 0) throw new Error("RETURN_NOT_FOUND");
    await this.audit(tenantId, actorUserId, "RETURN_REFUNDED", returnId);
    return prisma.return.findFirst({ where: { tenantId, id: returnId }, include: { lines: true } });
  }
}
