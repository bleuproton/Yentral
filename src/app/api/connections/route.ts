import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { IntegrationConnectionRepository } from "@/repositories/integrationConnectionRepository";

const repo = new IntegrationConnectionRepository();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const connections = await repo.list(session.tenantId);
  return NextResponse.json(connections);
}

const createSchema = z.object({
  connectorVersionId: z.string().min(1),
  config: z.record(z.any()).optional()
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const connection = await repo.create({
    tenantId: session.tenantId,
    connectorVersionId: parsed.data.connectorVersionId,
    config: parsed.data.config,
    status: "INACTIVE"
  });

  return NextResponse.json(connection, { status: 201 });
}
