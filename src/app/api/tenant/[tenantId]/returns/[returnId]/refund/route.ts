import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireTenantAccess } from "@/lib/tenantGuard";
import { ReturnsService } from "@/_legacy/services/returns/ReturnsService";

const service = new ReturnsService();

export async function POST(req: Request, { params }: { params: { tenantId: string; returnId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireTenantAccess(params.tenantId);

  try {
    const ret = await service.refundReturn(params.tenantId, session.user?.id ?? null, params.returnId);
    return NextResponse.json(ret);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
