// @ts-nocheck
import { SyncService } from '@/server/services/syncService';
import { withContext } from '@/server/tenant/als';

export async function syncConnectionFull(payload: { tenantId: string; connectionId: string }) {
  const svc = new SyncService();
  await withContext({ tenantId: payload.tenantId }, async () => {
    await svc.runConnectionSync({ tenantId: payload.tenantId }, payload.connectionId, {
      catalog: true,
      orders: true,
      inventory: true,
    });
  });
}
