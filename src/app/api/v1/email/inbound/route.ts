// @ts-nocheck
import { NextResponse } from "next/server";
import { EmailIngestService } from "@/domain/email/email-ingest.service";
import { prisma } from "@/lib/prisma";

const service = new EmailIngestService();

export async function POST(req: Request) {
  const secret = req.headers.get("x-inbound-secret");
  if (!secret || secret !== process.env.INBOUND_EMAIL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = await req.json();
  const to = payload.to?.[0]?.address ?? payload.to?.[0] ?? payload.to;
  if (!to) return NextResponse.json({ error: "NO_RECIPIENT" }, { status: 400 });

  const mailbox = await prisma.mailbox.findFirst({ where: { inboundAddress: to } });
  if (!mailbox) return NextResponse.json({ error: "MAILBOX_NOT_FOUND" }, { status: 404 });

  try {
    const result = await service.ingestInboundEmail(mailbox.tenantId, payload);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
