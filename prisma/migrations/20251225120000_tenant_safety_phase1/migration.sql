-- Add tenantId to User, Account, Session with backfill from Membership/User
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_tenantId_fkey";
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
UPDATE "User" u SET "tenantId" = m."tenantId" FROM "Membership" m WHERE m."userId" = u.id AND u."tenantId" IS NULL;
UPDATE "User" SET "tenantId" = (SELECT id FROM "Tenant" LIMIT 1) WHERE "tenantId" IS NULL;
ALTER TABLE "User" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Replace unique on email with tenant-scoped
DO $$BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_email_key') THEN
    ALTER TABLE "User" DROP CONSTRAINT "User_email_key";
  END IF;
END$$;
DROP INDEX IF EXISTS "User_tenantId_email_key";
CREATE UNIQUE INDEX IF NOT EXISTS "User_tenantId_email_key" ON "User"("tenantId","email");

ALTER TABLE "Account" DROP CONSTRAINT IF EXISTS "Account_tenantId_fkey";
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
UPDATE "Account" a SET "tenantId" = u."tenantId" FROM "User" u WHERE u.id = a."userId" AND a."tenantId" IS NULL;
UPDATE "Account" SET "tenantId" = (SELECT id FROM "Tenant" LIMIT 1) WHERE "tenantId" IS NULL;
ALTER TABLE "Account" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Account" ADD CONSTRAINT "Account_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
DO $$BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Account_provider_providerAccountId_key') THEN
    ALTER TABLE "Account" DROP CONSTRAINT "Account_provider_providerAccountId_key";
  END IF;
END$$;
DROP INDEX IF EXISTS "Account_tenantId_provider_providerAccountId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Account_tenantId_provider_providerAccountId_key" ON "Account"("tenantId","provider","providerAccountId");

ALTER TABLE "Session" DROP CONSTRAINT IF EXISTS "Session_tenantId_fkey";
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
UPDATE "Session" s SET "tenantId" = u."tenantId" FROM "User" u WHERE u.id = s."userId" AND s."tenantId" IS NULL;
UPDATE "Session" SET "tenantId" = (SELECT id FROM "Tenant" LIMIT 1) WHERE "tenantId" IS NULL;
ALTER TABLE "Session" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Session" ADD CONSTRAINT "Session_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
DO $$BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Session_sessionToken_key') THEN
    ALTER TABLE "Session" DROP CONSTRAINT "Session_sessionToken_key";
  END IF;
END$$;
DROP INDEX IF EXISTS "Session_tenantId_sessionToken_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Session_tenantId_sessionToken_key" ON "Session"("tenantId","sessionToken");

-- Product: add sku and tenant-scoped unique
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sku" TEXT;
DO $$BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='Product' AND column_name='slug'
  ) THEN
    UPDATE "Product" SET "sku" = COALESCE("slug",'sku-'||id) WHERE "sku" IS NULL;
  ELSE
    UPDATE "Product" SET "sku" = COALESCE("sku",'sku-'||id) WHERE "sku" IS NULL;
  END IF;
END$$;
ALTER TABLE "Product" ALTER COLUMN "sku" SET NOT NULL;
DO $$BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Product_tenantId_slug_key') THEN
    ALTER TABLE "Product" DROP CONSTRAINT "Product_tenantId_slug_key";
  END IF;
END$$;
DROP INDEX IF EXISTS "Product_tenantId_sku_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Product_tenantId_sku_key" ON "Product"("tenantId","sku");
DO $$BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='Product' AND column_name='slug'
  ) THEN
    CREATE INDEX IF NOT EXISTS "Product_tenantId_slug_idx" ON "Product"("tenantId","slug");
  END IF;
END$$;

-- OrderLine: add tenantId and backfill from Order
ALTER TABLE "OrderLine" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
UPDATE "OrderLine" ol SET "tenantId" = o."tenantId" FROM "Order" o WHERE o.id = ol."orderId" AND ol."tenantId" IS NULL;
UPDATE "OrderLine" SET "tenantId" = (SELECT id FROM "Tenant" LIMIT 1) WHERE "tenantId" IS NULL;
ALTER TABLE "OrderLine" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "OrderLine" DROP CONSTRAINT IF EXISTS "OrderLine_tenantId_fkey";
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "OrderLine_tenantId_orderId_idx" ON "OrderLine"("tenantId","orderId");

-- Jobs
ALTER TABLE "Job" ALTER COLUMN "tenantId" DROP DEFAULT;
UPDATE "Job" SET "tenantId" = (SELECT id FROM "Tenant" LIMIT 1) WHERE "tenantId" IS NULL;
ALTER TABLE "Job" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "dedupeKey" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "backoffSeconds" INTEGER;
DO $$BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Job_tenantId_dedupeKey_key') THEN
    ALTER TABLE "Job" DROP CONSTRAINT "Job_tenantId_dedupeKey_key";
  END IF;
END$$;
DROP INDEX IF EXISTS "Job_tenantId_dedupeKey_key";
ALTER TABLE "Job" DROP CONSTRAINT IF EXISTS "Job_tenantId_fkey";
CREATE UNIQUE INDEX IF NOT EXISTS "Job_tenantId_dedupeKey_key" ON "Job"("tenantId","dedupeKey");
ALTER TABLE "Job" ADD CONSTRAINT "Job_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- JobRun
ALTER TABLE "JobRun" ALTER COLUMN "tenantId" DROP DEFAULT;
UPDATE "JobRun" SET "tenantId" = COALESCE("tenantId",(SELECT id FROM "Tenant" LIMIT 1));
ALTER TABLE "JobRun" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "JobRun" ADD COLUMN IF NOT EXISTS "jobId" TEXT;
ALTER TABLE "JobRun" DROP CONSTRAINT IF EXISTS "JobRun_tenantId_fkey";
ALTER TABLE "JobRun" DROP CONSTRAINT IF EXISTS "JobRun_jobId_fkey";
ALTER TABLE "JobRun" ADD CONSTRAINT "JobRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobRun" ADD CONSTRAINT "JobRun_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AuditEvent table
CREATE TABLE IF NOT EXISTS "AuditEvent" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "AuditEvent_tenantId_resource_idx" ON "AuditEvent"("tenantId","resourceType","resourceId");
