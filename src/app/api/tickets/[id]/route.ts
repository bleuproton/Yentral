import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TicketService } from "@/services/ticketService";

const service = new TicketService();

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ticket = await service["repo"].getById(session.tenantId, params.id);
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const comments = await service["repo"].listComments(session.tenantId, params.id);
  return NextResponse.json({ ticket, comments });
}
