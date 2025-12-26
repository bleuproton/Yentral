import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireTenantAccess } from "@/lib/tenantGuard";
import { receiveReturnSchema } from "@/validators/returns";
import { ReturnsService } from "@/_legacy/services/returns/ReturnsService";

const service = new ReturnsService();

export async function POST(req: Request, { params }: { params: { tenantId: string; returnId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireTenantAccess(params.tenantId);

  const body = await req.json().catch(() => ({}));
  const parsed = receiveReturnSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const ret = await service.receiveReturn(params.tenantId, session.user?.id ?? null, {
      returnId: params.returnId,
      restockWarehouseId: parsed.data.restockWarehouseId,
      receivedAt: parsed.data.receivedAt
    });
    return NextResponse.json(ret);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
