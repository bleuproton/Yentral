import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { JobRepository } from "@/repositories/jobRepository";

const repo = new JobRepository();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const jobs = await repo.list(session.tenantId);
  return NextResponse.json(jobs);
}
