import type { ZodSchema } from "zod";

export type ChannelPluginContext = {
  tenantId: string;
};

export interface ChannelPlugin<TConfig extends Record<string, unknown> = Record<string, unknown>> {
  key: string;
  name: string;
  version: string;
  channel: string;
  description?: string;
  homepage?: string;
  configSchema?: ZodSchema<TConfig>;

  install(ctx: ChannelPluginContext, config: TConfig): Promise<void> | void;
  uninstall?(ctx: ChannelPluginContext): Promise<void> | void;
}

export type ChannelPluginDefinition<TConfig extends Record<string, unknown> = Record<string, unknown>> = Omit<
  ChannelPlugin<TConfig>,
  "install" | "uninstall"
> & {
  configSchema?: ZodSchema<TConfig>;
};
