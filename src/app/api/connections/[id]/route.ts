import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { IntegrationService } from "@/services/integrationService";
import { IntegrationConnectionStatus } from "@prisma/client";

const service = new IntegrationService();

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const schema = z.object({
    status: z.nativeEnum(IntegrationConnectionStatus).optional(),
    config: z.record(z.any()).optional()
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    if (parsed.data.status === IntegrationConnectionStatus.ACTIVE) {
      const result = await service.activateConnection(session.tenantId, params.id, parsed.data.config);
      return NextResponse.json({ ok: true, events: result.events });
    }
    if (parsed.data.status === IntegrationConnectionStatus.INACTIVE) {
      const result = await service.deactivateConnection(session.tenantId, params.id);
      return NextResponse.json({ ok: true, events: result.events });
    }
    if (parsed.data.status === IntegrationConnectionStatus.ERROR) {
      const result = await service.markError(session.tenantId, params.id, "manual");
      return NextResponse.json({ ok: true, events: result.events });
    }

    // If only config is provided without status change
    if (parsed.data.config) {
      await service["repo"].update(params.id, { config: parsed.data.config });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
