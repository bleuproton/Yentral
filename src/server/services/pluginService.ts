import { prisma } from '../db/prisma';
import { tenantDb } from '../db/tenantDb';
import { writeAudit } from '../audit/audit';

export class PluginService {
  constructor(private tenantId: string, private actorUserId: string) {}

  async listPlugins() {
    const [plugins, installations] = await Promise.all([
      prisma.plugin.findMany({ orderBy: { name: 'asc' } }),
      tenantDb(this.tenantId).pluginInstallation.findMany({
        where: { tenantId: this.tenantId },
      }),
    ]);
    const installedMap = new Map(installations.map((i) => [i.pluginId, i]));
    return plugins.map((p) => ({
      ...p,
      installed: installedMap.has(p.id),
      installation: installedMap.get(p.id) || null,
    }));
  }

  async installPlugin(pluginId: string, enabled = true, version?: string) {
    const db = tenantDb(this.tenantId);
    const installation = await db.pluginInstallation.upsert({
      where: { tenantId_pluginId: { tenantId: this.tenantId, pluginId } },
      update: { enabled, version },
      create: { tenantId: this.tenantId, pluginId, enabled, version: version ?? 'latest' },
    });
    await writeAudit(this.tenantId, this.actorUserId, 'plugin.install', 'PluginInstallation', installation.id, {
      pluginId,
      enabled,
    });
    return installation;
  }
}
