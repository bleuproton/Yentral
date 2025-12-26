import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { IntegrationConnectionRepository } from "@/_legacy/repositories/integrationConnectionRepository";

const repo = new IntegrationConnectionRepository();

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const connection = await repo.getById(session.tenantId, params.id);
  if (!connection) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fake test: just echo status OK
  return NextResponse.json({ ok: true, connectionId: connection.id, status: connection.status });
}
