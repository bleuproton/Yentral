-- Ensure tenant-scoped unique for Job
CREATE UNIQUE INDEX IF NOT EXISTS "Job_tenantId_id_key" ON "Job"("tenantId", "id");

-- Drop legacy JobRun FK if present
ALTER TABLE "JobRun" DROP CONSTRAINT IF EXISTS "JobRun_jobId_fkey";
ALTER TABLE "JobRun" DROP CONSTRAINT IF EXISTS "JobRun_tenantId_jobId_fkey";

-- Add tenant-scoped FK and supporting index
CREATE INDEX IF NOT EXISTS "JobRun_tenantId_jobId_idx" ON "JobRun"("tenantId", "jobId");
ALTER TABLE "JobRun" ADD CONSTRAINT "JobRun_tenantId_jobId_fkey" FOREIGN KEY ("tenantId", "jobId") REFERENCES "Job"("tenantId", "id") ON DELETE SET NULL ON UPDATE CASCADE;
