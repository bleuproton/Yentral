import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { InvoiceService } from "@/domain/finance/invoice.service";

const service = new InvoiceService();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const invoices = await service.listInvoices(session.tenantId);
  return NextResponse.json(invoices);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });
  try {
    const invoice = await service.createFromOrder(session.tenantId, body.orderId, {
      legalEntityId: body.legalEntityId,
      taxProfileId: body.taxProfileId
    });
    return NextResponse.json(invoice, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
