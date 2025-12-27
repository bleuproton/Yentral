-- CreateEnum
CREATE TYPE "AccountingPeriodStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "AccountingPeriod" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "legalEntityId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "AccountingPeriodStatus" NOT NULL DEFAULT 'OPEN',
    "closedAt" TIMESTAMP(3),
    "closedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountingPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostingLock" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "legalEntityId" TEXT NOT NULL,
    "lockedFromDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostingLock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountantAccess" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "legalEntityId" TEXT,
    "permissions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountantAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountingPeriod_tenantId_legalEntityId_status_idx" ON "AccountingPeriod"("tenantId", "legalEntityId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingPeriod_tenantId_id_key" ON "AccountingPeriod"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingPeriod_tenantId_legalEntityId_startDate_endDate_key" ON "AccountingPeriod"("tenantId", "legalEntityId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "PostingLock_tenantId_legalEntityId_lockedFromDate_idx" ON "PostingLock"("tenantId", "legalEntityId", "lockedFromDate");

-- CreateIndex
CREATE UNIQUE INDEX "PostingLock_tenantId_id_key" ON "PostingLock"("tenantId", "id");

-- CreateIndex
CREATE INDEX "AccountantAccess_tenantId_userId_idx" ON "AccountantAccess"("tenantId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountantAccess_tenantId_id_key" ON "AccountantAccess"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AccountantAccess_tenantId_userId_legalEntityId_key" ON "AccountantAccess"("tenantId", "userId", "legalEntityId");

-- AddForeignKey
ALTER TABLE "AccountingPeriod" ADD CONSTRAINT "AccountingPeriod_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingPeriod" ADD CONSTRAINT "AccountingPeriod_tenantId_legalEntityId_fkey" FOREIGN KEY ("tenantId", "legalEntityId") REFERENCES "LegalEntity"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostingLock" ADD CONSTRAINT "PostingLock_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostingLock" ADD CONSTRAINT "PostingLock_tenantId_legalEntityId_fkey" FOREIGN KEY ("tenantId", "legalEntityId") REFERENCES "LegalEntity"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountantAccess" ADD CONSTRAINT "AccountantAccess_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountantAccess" ADD CONSTRAINT "AccountantAccess_tenantId_legalEntityId_fkey" FOREIGN KEY ("tenantId", "legalEntityId") REFERENCES "LegalEntity"("tenantId", "id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountantAccess" ADD CONSTRAINT "AccountantAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
