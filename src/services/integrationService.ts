import { IntegrationConnectionStatus } from "@prisma/client";
import { IntegrationConnectionRepository } from "@/repositories/integrationConnectionRepository";

export class IntegrationService {
  constructor(private repo = new IntegrationConnectionRepository()) {}

  async activateConnection(tenantId: string, connectionId: string, config?: Record<string, unknown>) {
    const conn = await this.repo.getById(tenantId, connectionId);
    if (!conn) throw new Error("Connection not found");
    await this.repo.update(connectionId, { status: IntegrationConnectionStatus.ACTIVE, config });
    return { events: [{ type: "integration.activated", tenantId, connectionId }] };
  }

  async deactivateConnection(tenantId: string, connectionId: string, reason?: string) {
    const conn = await this.repo.getById(tenantId, connectionId);
    if (!conn) throw new Error("Connection not found");
    await this.repo.update(connectionId, { status: IntegrationConnectionStatus.INACTIVE });
    return { events: [{ type: "integration.deactivated", tenantId, connectionId, reason }] };
  }

  async markError(tenantId: string, connectionId: string, reason: string) {
    const conn = await this.repo.getById(tenantId, connectionId);
    if (!conn) throw new Error("Connection not found");
    await this.repo.update(connectionId, { status: IntegrationConnectionStatus.ERROR });
    return { events: [{ type: "integration.error", tenantId, connectionId, reason }] };
  }
}
