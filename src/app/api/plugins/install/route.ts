import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { assertInstallerRole, ensureRegistryPlugin } from "@/lib/plugins";
import { findPlugin } from "@/plugins/registry";

const installSchema = z.object({
  pluginKey: z.string(),
  version: z.string().optional(),
  config: z.record(z.any()).optional()
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    assertInstallerRole(session.role as Role);
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = installSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { pluginKey, version, config } = parsed.data;
  const registryDef = findPlugin(pluginKey);
  if (!registryDef) {
    return NextResponse.json({ error: "Plugin not found in registry" }, { status: 404 });
  }

  // Validate config against registry schema if present
  let parsedConfig: Record<string, unknown> | undefined;
  if (registryDef.configSchema) {
    const parsedResult = registryDef.configSchema.safeParse(config ?? {});
    if (!parsedResult.success) {
      return NextResponse.json({ error: parsedResult.error.flatten() }, { status: 400 });
    }
    parsedConfig = parsedResult.data;
  } else {
    parsedConfig = config;
  }

  const { plugin } = await ensureRegistryPlugin(pluginKey);

  const installation = await prisma.pluginInstallation.upsert({
    where: { tenantId_pluginId: { tenantId: session.tenantId, pluginId: plugin.id } },
    update: {
      version: version || registryDef.version,
      enabled: true,
      config: parsedConfig ?? {}
    },
    create: {
      tenantId: session.tenantId,
      pluginId: plugin.id,
      version: version || registryDef.version,
      enabled: true,
      config: parsedConfig ?? {}
    }
  });

  return NextResponse.json({
    plugin: {
      key: plugin.key,
      name: plugin.name,
      version: installation.version,
      channel: plugin.channel,
      isChannelPlugin: plugin.isChannelPlugin
    },
    installation
  });
}
