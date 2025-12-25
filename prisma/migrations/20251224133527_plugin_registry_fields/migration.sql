-- AlterTable
ALTER TABLE "Plugin" ADD COLUMN     "channel" TEXT,
ADD COLUMN     "configSchema" JSONB,
ADD COLUMN     "homepage" TEXT,
ADD COLUMN     "isChannelPlugin" BOOLEAN NOT NULL DEFAULT false;
