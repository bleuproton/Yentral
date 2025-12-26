import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireTenantAccess } from "@/lib/tenantGuard";
import { createReturnSchema } from "@/validators/returns";
import { ReturnsService } from "@/services/returns/ReturnsService";
import { prisma } from "@/lib/prisma";

const service = new ReturnsService();

export async function GET(req: Request, { params }: { params: { tenantId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireTenantAccess(params.tenantId);

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId") || undefined;
  const status = searchParams.get("status") || undefined;
  const returns = await prisma.return.findMany({
    where: { tenantId: params.tenantId, orderId, status: status as any },
    include: { lines: true },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(returns);
}

export async function POST(req: Request, { params }: { params: { tenantId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireTenantAccess(params.tenantId);

  const body = await req.json();
  const parsed = createReturnSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const ret = await service.createReturn(params.tenantId, session.user?.id ?? null, parsed.data);
    return NextResponse.json(ret, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
