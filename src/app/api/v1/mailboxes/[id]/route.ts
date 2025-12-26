import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MailboxService } from "@/domain/email/mailbox.service";

const service = new MailboxService();

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const mb = await service.getMailbox(session.tenantId, params.id);
  if (!mb) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(mb);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  await service.updateMailbox(session.tenantId, params.id, body);
  const mb = await service.getMailbox(session.tenantId, params.id);
  return NextResponse.json(mb);
}
