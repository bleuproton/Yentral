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

  if (![JobStatus.FAILED, JobStatus.CANCELLED].includes(job.status)) {
    return NextResponse.json({ error: "Job not in failed/cancelled state" }, { status: 400 });
  }

  await service["repo"].reschedule(session.tenantId, params.id, 0);
  return NextResponse.json({ ok: true });
}
