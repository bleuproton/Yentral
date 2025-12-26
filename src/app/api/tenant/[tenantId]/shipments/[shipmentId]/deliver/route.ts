import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireTenantAccess } from "@/lib/tenantGuard";
import { deliverShipmentSchema } from "@/validators/fulfillment";
import { FulfillmentService } from "@/services/fulfillment/FulfillmentService";

const service = new FulfillmentService();

export async function POST(req: Request, { params }: { params: { tenantId: string; shipmentId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireTenantAccess(params.tenantId);

  const body = await req.json().catch(() => ({}));
  const parsed = deliverShipmentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const shipment = await service.markShipmentDelivered(
      params.tenantId,
      session.user?.id ?? null,
      params.shipmentId,
      parsed.data.deliveredAt
    );
    return NextResponse.json(shipment);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
