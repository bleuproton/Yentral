import { z } from "zod";
import type { ChannelPluginDefinition } from "./channel-plugin";

const billingConfigSchema = z.object({
  stripePriceId: z.string(),
  sendReceiptEmail: z.boolean().default(true)
});

const emailIngestSchema = z.object({
  inboxAddress: z.string().email(),
  provider: z.string().default("imap"),
  folder: z.string().default("INBOX")
});

const slaMonitorSchema = z.object({
  maxOpenHours: z.number().default(48),
  notifyEmail: z.string().email().optional()
});

export const pluginRegistry: ChannelPluginDefinition[] = [
  {
    key: "billing",
    name: "Billing",
    version: "1.0.0",
    channel: "payments",
    description: "Core billing plugin with Stripe Checkout integration",
    homepage: "https://example.com/plugins/billing",
    configSchema: billingConfigSchema
  },
  {
    key: "email-ingest",
    name: "Email Ingest",
    version: "1.0.0",
    channel: "communications",
    description: "Parses inbound support emails into tickets",
    homepage: "https://example.com/plugins/email-ingest",
    configSchema: emailIngestSchema
  },
  {
    key: "sla-monitor",
    name: "SLA Monitor",
    version: "1.0.0",
    channel: "support",
    description: "Monitors ticket SLAs and raises alerts",
    homepage: "https://example.com/plugins/sla-monitor",
    configSchema: slaMonitorSchema
  }
];

export function findPlugin(key: string) {
  return pluginRegistry.find((p) => p.key === key);
}
