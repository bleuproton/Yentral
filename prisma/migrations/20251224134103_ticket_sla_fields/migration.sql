-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "lastSlaNotifiedAt" TIMESTAMP(3),
ADD COLUMN     "slaDueAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Ticket_slaDueAt_idx" ON "Ticket"("slaDueAt");
