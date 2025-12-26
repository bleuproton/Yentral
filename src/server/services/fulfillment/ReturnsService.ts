import { ReturnStatus, StockLedgerKind } from "@prisma/client";
import prisma from "@/server/db/prisma";
import { StockService } from "@/server/services/inventory/StockService";

type ReturnLineInput = { orderLineId: string; qty: number; condition?: string | null };

export class ReturnsService {
  async createReturn(tenantId: string, input: { orderId: string; lines: ReturnLineInput[]; reason?: string | null }) {
    const { orderId, lines, reason } = input;
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
        data: {
          tenantId,
          orderId,
          status: ReturnStatus.REQUESTED,
          reason: reason ?? null
        }
      });

      for (const l of lines) {
        const variantId = olMap.get(l.orderLineId)!.variantId!;
        await tx.returnLine.create({
          data: {
            tenantId,
            returnId: ret.id,
            orderLineId: l.orderLineId,
            variantId,
            qty: l.qty,
            condition: l.condition ?? null
          }
        });
      }

      return tx.return.findFirst({ where: { tenantId, id: ret.id }, include: { lines: true } });
    });
  }

  async markReturnReceived(tenantId: string, input: { returnId: string; warehouseId: string; receivedAt?: Date | null }) {
    const { returnId, warehouseId, receivedAt } = input;

    return prisma.$transaction(async (tx) => {
      const ret = await tx.return.findFirst({ where: { tenantId, id: returnId }, include: { lines: true } });
      if (!ret) throw new Error("RETURN_NOT_FOUND");
      const warehouse = await tx.warehouse.findFirst({ where: { tenantId, id: warehouseId } });
      if (!warehouse) throw new Error("WAREHOUSE_NOT_FOUND");

      const stock = new StockService(tx);

      for (const line of ret.lines) {
        await stock.applySnapshotDelta(tenantId, warehouseId, line.variantId, line.qty, 0);
        await stock.ledger({
          tenantId,
          warehouseId,
          variantId: line.variantId,
          qtyDelta: line.qty,
          kind: StockLedgerKind.RETURN,
          reason: "RETURN_RECEIVED",
          refType: "Return",
          refId: ret.id
        });
      }

      return tx.return.update({
        where: { id: ret.id },
        data: {
          status: ReturnStatus.RECEIVED,
          receivedAt: receivedAt ?? new Date()
        }
      });
    });
  }

  markReturnRefunded(tenantId: string, returnId: string) {
    return prisma.return.updateMany({
      where: { tenantId, id: returnId },
      data: { status: ReturnStatus.REFUNDED }
    });
  }
}
