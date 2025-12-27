-- DropIndex
DROP INDEX "WebhookEndpoint_token_key";

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEndpoint_tenantId_token_key" ON "WebhookEndpoint"("tenantId", "token");

