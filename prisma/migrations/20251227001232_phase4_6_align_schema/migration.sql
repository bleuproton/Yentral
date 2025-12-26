-- CreateEnum (idempotent)
DO $$ BEGIN
    CREATE TYPE "MailboxProvider" AS ENUM ('GENERIC_WEBHOOK', 'SMTP_IMAP');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "EmailDirection" AS ENUM ('INBOUND', 'OUTBOUND');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "EmailThreadStatus" AS ENUM ('OPEN', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- DropForeignKey (guarded)
ALTER TABLE "Invoice" DROP CONSTRAINT IF EXISTS "Invoice_customerId_fkey";

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "emailThreadId" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Mailbox" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" "MailboxProvider" NOT NULL DEFAULT 'GENERIC_WEBHOOK',
    "inboundAddress" TEXT NOT NULL,
    "outboundFrom" TEXT,
    "config" JSONB,
    "lastSyncAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mailbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "EmailThread" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "mailboxId" TEXT NOT NULL,
    "status" "EmailThreadStatus" NOT NULL DEFAULT 'OPEN',
    "subject" TEXT,
    "participants" JSONB,
    "externalThreadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "EmailMessage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "direction" "EmailDirection" NOT NULL,
    "messageId" TEXT,
    "inReplyTo" TEXT,
    "from" JSONB NOT NULL,
    "to" JSONB NOT NULL,
    "cc" JSONB,
    "bcc" JSONB,
    "subject" TEXT,
    "textBody" TEXT,
    "htmlBody" TEXT,
    "headers" JSONB,
    "raw" JSONB,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Mailbox_tenantId_idx" ON "Mailbox"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Mailbox_tenantId_inboundAddress_key" ON "Mailbox"("tenantId", "inboundAddress");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Mailbox_tenantId_id_key" ON "Mailbox"("tenantId", "id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EmailThread_tenantId_mailboxId_idx" ON "EmailThread"("tenantId", "mailboxId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EmailThread_tenantId_id_key" ON "EmailThread"("tenantId", "id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EmailMessage_tenantId_threadId_idx" ON "EmailMessage"("tenantId", "threadId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EmailMessage_tenantId_messageId_idx" ON "EmailMessage"("tenantId", "messageId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EmailMessage_tenantId_id_key" ON "EmailMessage"("tenantId", "id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Invoice_tenantId_customerId_idx" ON "Invoice"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Ticket_tenantId_emailThreadId_idx" ON "Ticket"("tenantId", "emailThreadId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Ticket_tenantId_id_key" ON "Ticket"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Ticket_tenantId_emailThreadId_key" ON "Ticket"("tenantId", "emailThreadId");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_tenantId_customerId_fkey" FOREIGN KEY ("tenantId", "customerId") REFERENCES "Customer"("tenantId", "id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mailbox" ADD CONSTRAINT "Mailbox_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailThread" ADD CONSTRAINT "EmailThread_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailThread" ADD CONSTRAINT "EmailThread_tenantId_mailboxId_fkey" FOREIGN KEY ("tenantId", "mailboxId") REFERENCES "Mailbox"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_tenantId_threadId_fkey" FOREIGN KEY ("tenantId", "threadId") REFERENCES "EmailThread"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_tenantId_emailThreadId_fkey" FOREIGN KEY ("tenantId", "emailThreadId") REFERENCES "EmailThread"("tenantId", "id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex (guarded)
ALTER INDEX IF EXISTS "StockReservation_tenant_dedupe_key" RENAME TO "StockReservation_tenantId_dedupeKey_key";

ALTER INDEX IF EXISTS "StockReservation_tenant_orderLine_idx" RENAME TO "StockReservation_tenantId_orderLineId_idx";

ALTER INDEX IF EXISTS "StockReservation_tenant_wh_variant_idx" RENAME TO "StockReservation_tenantId_warehouseId_variantId_idx";
