// @ts-nocheck
import { JobStatus, TicketStatus } from "@prisma/client";
import type Boss from "pg-boss";
import prisma from "@/lib/prisma";
import { ingestImapBatch, sendAutoReply, hasImapConfig, hasSmtpConfig } from "@/lib/mail";

type JobMeta = Record<string, unknown> | null | undefined;

async function trackRun<T>(
  jobName: string,
  tenantId: string | null | undefined,
  attempts: number | undefined,
  maxAttempts: number | undefined,
  meta: JobMeta,
  work: () => Promise<T>
) {
  const run = await prisma.jobRun.create({
    data: {
      jobName,
      tenantId: tenantId ?? null,
      status: JobStatus.RUNNING,
      attempts: attempts ?? 0,
      maxAttempts: maxAttempts ?? 5,
      meta
    }
  });

  try {
    const result = await work();
    await prisma.jobRun.update({
      where: { id: run.id },
      data: { status: JobStatus.COMPLETED, finishedAt: new Date() }
    });
    return result;
  } catch (err: any) {
    await prisma.jobRun.update({
      where: { id: run.id },
      data: {
        status: JobStatus.FAILED,
        finishedAt: new Date(),
        error: err?.message || "Job failed"
      }
    });
    throw err;
  }
}

export async function registerProcessors(boss: Boss) {
  // Sync job: placeholder for data sync/integration
  await boss.work("sync.job", async (job) => {
    const data = (job.data as any) || {};
    await trackRun(
      "sync.job",
      data.tenantId,
      job.retrycount,
      job.retrylimit,
      data,
      async () => {
        // Simulated sync logic
        await prisma.job.create({
          data: {
            tenantId: data.tenantId ?? null,
            type: "sync.job",
            status: JobStatus.COMPLETED,
            payload: data
          }
        });
      }
    );
  });

  // Email ingest job: pulls IMAP inbox and creates tickets + auto-replies
  await boss.work("email.ingest", async (job) => {
    const data = (job.data as any) || {};
    await trackRun(
      "email.ingest",
      data.tenantId,
      job.retrycount,
      job.retrylimit,
      data,
      async () => {
        if (!hasImapConfig()) {
          await prisma.job.create({
            data: {
              tenantId: data.tenantId ?? null,
              type: "email.ingest",
              status: JobStatus.FAILED,
              payload: { reason: "Missing IMAP config", ...data }
            }
          });
          return;
        }

        if (!data.userId) {
          throw new Error("email.ingest requires userId (author)");
        }

        const emails = await ingestImapBatch(data.limit ?? 5);
        const createdTickets = [];

        for (const email of emails) {
          const ticket = await prisma.ticket.create({
            data: {
              tenantId: data.tenantId,
              authorId: data.userId,
              assigneeId: data.assigneeId ?? null,
              title: email.subject || "Support request",
              description: email.text?.slice(0, 2000) ?? "",
              status: TicketStatus.OPEN,
              priority: 3,
              slaDueAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
              lastSlaNotifiedAt: null
            }
          });
          createdTickets.push(ticket.id);

          if (hasSmtpConfig() && email.from) {
            try {
              await sendAutoReply(
                email.from,
                `Re: ${email.subject || "Support"}`,
                "We received your request and will respond shortly."
              );
            } catch (err) {
              // eslint-disable-next-line no-console
              console.error("Auto-reply failed", err);
            }
          }
        }

        await prisma.job.create({
          data: {
            tenantId: data.tenantId ?? null,
            type: "email.ingest",
            status: JobStatus.COMPLETED,
            payload: { ...data, ingested: emails.length, tickets: createdTickets }
          }
        });
      }
    );
  });

  // SLA monitor job: evaluate ticket SLAs
  await boss.work("sla.monitor", async (job) => {
    const data = (job.data as any) || {};
    await trackRun(
      "sla.monitor",
      data.tenantId,
      job.retrycount,
      job.retrylimit,
      data,
      async () => {
        const now = new Date();
        const soon = new Date(Date.now() + 60 * 60 * 1000); // 1h
        const atRisk = await prisma.ticket.findMany({
          where: {
            tenantId: data.tenantId ?? undefined,
            status: { in: ["OPEN", "IN_PROGRESS"] },
            slaDueAt: { lte: soon }
          }
        });
        const overdue = atRisk.filter((t) => t.slaDueAt && t.slaDueAt < now).length;

        await prisma.ticket.updateMany({
          where: {
            id: { in: atRisk.map((t) => t.id) }
          },
          data: { lastSlaNotifiedAt: now }
        });

        await prisma.job.create({
          data: {
            tenantId: data.tenantId ?? null,
            type: "sla.monitor",
            status: JobStatus.COMPLETED,
            payload: { ...data, overdue, atRisk: atRisk.length }
          }
        });
      }
    );
  });
}
