// @ts-nocheck
export type NodeRunContext = {
  tenantId: string;
  connectionId?: string;
  config: any;
  input: any;
};

export type NodeDefinition = {
  key: string;
  displayName: string;
  run: (ctx: NodeRunContext) => Promise<any>;
};
