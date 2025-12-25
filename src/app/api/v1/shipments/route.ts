import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { FulfillmentService } from "@/domain/fulfillment/fulfillment.service";

const service = new FulfillmentService();

const shipmentLineSchema = z.object({
  orderLineId: z.string().min(1),
  variantId: z.string().min(1),
  qty: z.number().int().positive()
});

const createShipmentSchema = z.object({
  orderId: z.string().min(1),
  warehouseId: z.string().min(1),
  lines: z.array(shipmentLineSchema).min(1),
  carrier: z.string().optional(),
  trackingNo: z.string().optional(),
  meta: z.any().optional()
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shipments = await service.listShipments(session.tenantId);
  return NextResponse.json(shipments);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createShipmentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const shipment = await service.createShipment({
      tenantId: session.tenantId,
      ...parsed.data
    });
    return NextResponse.json(shipment, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
