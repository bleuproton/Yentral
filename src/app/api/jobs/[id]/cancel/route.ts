import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { JobService } from "@/services/jobService";
import { JobStatus } from "@prisma/client";

const service = new JobService();

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const job = await service["repo"].getById(session.tenantId, params.id);
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if ([JobStatus.COMPLETED].includes(job.status)) {
    return NextResponse.json({ error: "Job already completed" }, { status: 400 });
  }

  await service["repo"].update(params.id, { status: JobStatus.CANCELLED, finishedAt: new Date() });
  return NextResponse.json({ ok: true });
}
