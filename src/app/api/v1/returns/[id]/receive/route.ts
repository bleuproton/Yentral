// @ts-nocheck
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { FulfillmentService } from "@/domain/fulfillment/fulfillment.service";

const service = new FulfillmentService();

const receiveSchema = z.object({
  warehouseId: z.string().optional()
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = receiveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const ret = await service.receiveExistingReturn(session.tenantId, params.id, parsed.data.warehouseId);
    return NextResponse.json(ret);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
