// @ts-nocheck
import { withContext } from '@/server/tenant/als';
import { prisma } from '@/server/db';

type Payload = { tenantId: string; connectionId: string };

export async function syncConnection(payload: Payload) {
  const { tenantId, connectionId } = payload;
  await withContext({ tenantId }, async () => {
    await prisma.integrationConnection.update({
      where: { tenantId_id: { tenantId, id: connectionId } },
      data: { lastSyncAt: new Date(), lastError: null },
    });
    await prisma.auditEvent.create({
      data: {
        tenantId,
        action: 'integration.sync',
        resourceType: 'IntegrationConnection',
        resourceId: connectionId,
        actorUserId: null,
        metadataJson: {},
      },
    });
  });
}
