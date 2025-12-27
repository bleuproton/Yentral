// @ts-nocheck
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const connectors = await prisma.connector.findMany({
    include: { versions: true },
    orderBy: { name: "asc" }
  });
  return NextResponse.json(connectors);
}
