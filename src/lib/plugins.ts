import { hasRequiredRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { findPlugin } from "@/plugins/registry";
import { Role } from "@prisma/client";

export async function ensureRegistryPlugin(pluginKey: string) {
  const def = findPlugin(pluginKey);
  if (!def) {
    throw new Error("Unknown plugin key");
  }

  const plugin = await prisma.plugin.upsert({
    where: { key: def.key },
    update: {
      name: def.name,
      description: def.description,
      latestVersion: def.version,
      channel: def.channel,
      homepage: def.homepage,
      configSchema: def.configSchema ? def.configSchema.toString() : undefined,
      isChannelPlugin: true
    },
    create: {
      key: def.key,
      name: def.name,
      description: def.description,
      latestVersion: def.version,
      channel: def.channel,
      homepage: def.homepage,
      configSchema: def.configSchema ? def.configSchema.toString() : undefined,
      isChannelPlugin: true
    }
  });

  return { plugin, def };
}

export function assertInstallerRole(role: Role) {
  if (!hasRequiredRole(role, [Role.OWNER, Role.ADMIN])) {
    throw new Error("Forbidden");
  }
}
