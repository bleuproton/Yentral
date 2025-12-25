import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { TicketService } from "@/services/ticketService";

const service = new TicketService();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tickets = await service["repo"].list(session.tenantId, { take: 50 });
  return NextResponse.json(tickets);
}

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.number().int().min(1).max(5).optional()
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const result = await service.createTicket(session.tenantId, {
      authorId: session.user.id,
      ...parsed.data
    });
    return NextResponse.json(result.ticket, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
