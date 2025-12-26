import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { FulfillmentService } from "@/domain/fulfillment/fulfillment.service";

const service = new FulfillmentService();

const returnLineSchema = z.object({
  orderLineId: z.string().min(1),
  variantId: z.string().min(1),
  qty: z.number().int().positive(),
  condition: z.string().optional()
});

const receiveSchema = z.object({
  orderId: z.string().min(1),
  warehouseId: z.string().optional(),
  lines: z.array(returnLineSchema).min(1),
  reason: z.string().optional(),
  meta: z.any().optional()
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const returns = await service.listReturns(session.tenantId);
  return NextResponse.json(returns);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = receiveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const ret = await service.receiveReturn({
      tenantId: session.tenantId,
      ...parsed.data
    });
    return NextResponse.json(ret, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
