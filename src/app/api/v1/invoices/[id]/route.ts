import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { InvoiceService } from "@/domain/finance/invoice.service";

const service = new InvoiceService();

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const invoice = await service.getInvoice(session.tenantId, params.id);
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(invoice);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  try {
    if (body.action === "issue") {
      const inv = await service.issueInvoice(session.tenantId, params.id);
      return NextResponse.json(inv);
    }
    if (body.action === "paid") {
      const inv = await service.markPaid(session.tenantId, params.id, body.paidAt ? new Date(body.paidAt) : undefined);
      return NextResponse.json(inv);
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
