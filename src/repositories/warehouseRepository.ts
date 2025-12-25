import { prisma } from "@/lib/prisma";
import type {
  Prisma,
  Warehouse,
  StockLedger,
  StockSnapshot,
  StockReservation
} from "@prisma/client";

type CreateWarehouseInput = Omit<Prisma.WarehouseUncheckedCreateInput, "tenantId"> & { tenantId: string };
type UpdateWarehouseInput = Prisma.WarehouseUncheckedUpdateInput;
type LedgerInput = Omit<Prisma.StockLedgerUncheckedCreateInput, "tenantId"> & { tenantId: string };
type SnapshotInput = Omit<Prisma.StockSnapshotUncheckedCreateInput, "tenantId"> & { tenantId: string };
type ReservationInput = Omit<Prisma.StockReservationUncheckedCreateInput, "tenantId"> & { tenantId: string };

export class WarehouseRepository {
  async getWarehouse(tenantId: string, id: string): Promise<Warehouse | null> {
    return prisma.warehouse.findFirst({ where: { tenantId, id } });
  }

  async listWarehouses(tenantId: string) {
    return prisma.warehouse.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } });
  }

  async createWarehouse(data: CreateWarehouseInput) {
    return prisma.warehouse.create({ data });
  }

  async updateWarehouse(id: string, data: UpdateWarehouseInput) {
    return prisma.warehouse.update({ where: { id }, data });
  }

  async deleteWarehouse(id: string) {
    return prisma.warehouse.delete({ where: { id } });
  }

  async recordLedgerEntry(data: LedgerInput): Promise<StockLedger> {
    return prisma.stockLedger.create({ data });
  }

  async latestSnapshot(tenantId: string, warehouseId: string, variantId: string): Promise<StockSnapshot | null> {
    return prisma.stockSnapshot.findFirst({
      where: { tenantId, warehouseId, variantId },
      orderBy: { at: "desc" }
    });
  }

  async saveSnapshot(data: SnapshotInput): Promise<StockSnapshot> {
    return prisma.stockSnapshot.create({ data });
  }

  async createReservation(data: ReservationInput): Promise<StockReservation> {
    return prisma.stockReservation.create({ data });
  }

  async listReservations(tenantId: string, variantId: string) {
    return prisma.stockReservation.findMany({ where: { tenantId, variantId } });
  }
}
