-- CreateEnum
CREATE TYPE "FlowStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- AlterTable
ALTER TABLE "Flow" ADD COLUMN     "definition" JSONB,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "status" "FlowStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "FlowRun" ADD COLUMN     "triggerPayload" JSONB,
ADD COLUMN     "triggerType" TEXT;

-- CreateTable
CREATE TABLE "FlowRunStep" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "flowRunId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "input" JSONB,
    "output" JSONB,
    "error" TEXT,

    CONSTRAINT "FlowRunStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FlowRunStep_tenantId_flowRunId_idx" ON "FlowRunStep"("tenantId", "flowRunId");

-- CreateIndex
CREATE UNIQUE INDEX "FlowRunStep_tenantId_id_key" ON "FlowRunStep"("tenantId", "id");

-- CreateIndex
CREATE INDEX "FlowRun_tenantId_flowId_idx" ON "FlowRun"("tenantId", "flowId");

-- AddForeignKey
ALTER TABLE "FlowRunStep" ADD CONSTRAINT "FlowRunStep_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowRunStep" ADD CONSTRAINT "FlowRunStep_tenantId_flowRunId_fkey" FOREIGN KEY ("tenantId", "flowRunId") REFERENCES "FlowRun"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

