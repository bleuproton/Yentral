import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";
import { env } from "./env";

export type IngestedEmail = {
  from: string;
  subject: string;
  text: string;
  messageId?: string;
};

export function hasImapConfig() {
  return Boolean(env.IMAP_HOST && env.IMAP_USER && env.IMAP_PASSWORD);
}

export function hasSmtpConfig() {
  return Boolean(env.SMTP_HOST);
}

export async function ingestImapBatch(limit = 5): Promise<IngestedEmail[]> {
  if (!hasImapConfig()) return [];

  const client = new ImapFlow({
    host: env.IMAP_HOST!,
    port: env.IMAP_PORT ?? 993,
    secure: env.IMAP_TLS === undefined ? true : env.IMAP_TLS === true || env.IMAP_TLS === "true",
    auth: {
      user: env.IMAP_USER!,
      pass: env.IMAP_PASSWORD!
    }
  });

  const emails: IngestedEmail[] = [];
  try {
    await client.connect();
    let lock = await client.getMailboxLock("INBOX");
    try {
      for await (const msg of client.fetch({ seen: false }, { envelope: true, bodyStructure: true, source: true, uid: true })) {
        const subject = msg.envelope?.subject ?? "(no subject)";
        const fromAddr = msg.envelope?.from?.[0];
        const from = fromAddr ? `${fromAddr.name ?? ""} <${fromAddr.address}>`.trim() : "unknown";

        const text = msg.source?.toString() ?? "";
        emails.push({ from, subject, text, messageId: msg.envelope?.messageId });

        if (emails.length >= limit) break;
      }
    } finally {
      lock.release();
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("IMAP ingest failed", err);
  } finally {
    try {
      await client.logout();
    } catch {
      // ignore
    }
  }

  return emails;
}

export async function sendAutoReply(to: string, subject: string, body: string) {
  if (!hasSmtpConfig()) {
    throw new Error("SMTP config missing");
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST!,
    port: env.SMTP_PORT ?? 587,
    secure: (env.SMTP_PORT ?? 587) === 465,
    auth: env.SMTP_USER
      ? {
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD
        }
      : undefined
  });

  await transporter.sendMail({
    from: env.SMTP_FROM || env.SMTP_USER || "support@example.com",
    to,
    subject,
    text: body
  });
}
