-- Patch after Phase 3: add raw payloads and align updatedAt columns to Prisma @updatedAt semantics.

ALTER TABLE "ChannelProduct" ADD COLUMN IF NOT EXISTS "raw" JSONB;
ALTER TABLE "ChannelVariant" ADD COLUMN IF NOT EXISTS "raw" JSONB;

-- Drop default on updatedAt so Prisma @updatedAt can manage the timestamp
ALTER TABLE "ChannelOrder" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "ChannelProduct" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "ChannelVariant" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "IntegrationConnection" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "ProductVariant" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "StockReservation" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "StockSnapshot" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "WarehouseMapping" ALTER COLUMN "updatedAt" DROP DEFAULT;
