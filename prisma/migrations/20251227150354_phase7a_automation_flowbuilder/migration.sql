-- CreateEnum
CREATE TYPE "FlowRunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Flow" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlowVersion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "definition" JSONB NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlowVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlowTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "definition" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlowTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlowRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "flowVersionId" TEXT NOT NULL,
    "status" "FlowRunStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "input" JSONB,
    "output" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlowRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlowRunLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlowRunLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEndpoint" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Secret" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Secret_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT,
    "config" JSONB,
    "secretId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Flow_tenantId_id_key" ON "Flow"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Flow_tenantId_slug_key" ON "Flow"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "FlowVersion_tenantId_flowId_idx" ON "FlowVersion"("tenantId", "flowId");

-- CreateIndex
CREATE UNIQUE INDEX "FlowVersion_tenantId_id_key" ON "FlowVersion"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FlowVersion_tenantId_flowId_version_key" ON "FlowVersion"("tenantId", "flowId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "FlowTemplate_tenantId_id_key" ON "FlowTemplate"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FlowTemplate_tenantId_name_key" ON "FlowTemplate"("tenantId", "name");

-- CreateIndex
CREATE INDEX "FlowRun_tenantId_status_idx" ON "FlowRun"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FlowRun_tenantId_id_key" ON "FlowRun"("tenantId", "id");

-- CreateIndex
CREATE INDEX "FlowRunLog_tenantId_runId_idx" ON "FlowRunLog"("tenantId", "runId");

-- CreateIndex
CREATE UNIQUE INDEX "FlowRunLog_tenantId_id_key" ON "FlowRunLog"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEndpoint_token_key" ON "WebhookEndpoint"("token");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEndpoint_tenantId_id_key" ON "WebhookEndpoint"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Secret_tenantId_id_key" ON "Secret"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Secret_tenantId_name_key" ON "Secret"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_tenantId_id_key" ON "Credential"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_tenantId_name_key" ON "Credential"("tenantId", "name");

-- AddForeignKey
ALTER TABLE "Flow" ADD CONSTRAINT "Flow_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowVersion" ADD CONSTRAINT "FlowVersion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowVersion" ADD CONSTRAINT "FlowVersion_tenantId_flowId_fkey" FOREIGN KEY ("tenantId", "flowId") REFERENCES "Flow"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowTemplate" ADD CONSTRAINT "FlowTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowRun" ADD CONSTRAINT "FlowRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowRun" ADD CONSTRAINT "FlowRun_tenantId_flowId_fkey" FOREIGN KEY ("tenantId", "flowId") REFERENCES "Flow"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowRun" ADD CONSTRAINT "FlowRun_tenantId_flowVersionId_fkey" FOREIGN KEY ("tenantId", "flowVersionId") REFERENCES "FlowVersion"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowRunLog" ADD CONSTRAINT "FlowRunLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowRunLog" ADD CONSTRAINT "FlowRunLog_tenantId_runId_fkey" FOREIGN KEY ("tenantId", "runId") REFERENCES "FlowRun"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEndpoint" ADD CONSTRAINT "WebhookEndpoint_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEndpoint" ADD CONSTRAINT "WebhookEndpoint_tenantId_flowId_fkey" FOREIGN KEY ("tenantId", "flowId") REFERENCES "Flow"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Secret" ADD CONSTRAINT "Secret_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_tenantId_secretId_fkey" FOREIGN KEY ("tenantId", "secretId") REFERENCES "Secret"("tenantId", "id") ON DELETE SET NULL ON UPDATE CASCADE;

