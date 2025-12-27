// @ts-nocheck
import { Prisma, PrismaClient } from '@prisma/client';
import { HttpError } from '@/lib/httpErrors';
import { getContext } from '../tenant/als';
import { logger } from '../log/logger';

const GLOBAL_MODELS = new Set<string>([
  'User',
  'Account',
  'Session',
  'VerificationToken',
  'Jurisdiction',
  'Connector',
  'ConnectorVersion',
  'Plugin',
  'Tenant',
]);

const TENANT_MODELS = new Set<string>([
  'Membership',
  'Organization',
  'LegalEntity',
  'TaxProfile',
  'Product',
  'ProductVariant',
  'Warehouse',
  'InventoryItem',
  'StockLedger',
  'StockSnapshot',
  'StockReservation',
  'Order',
  'OrderLine',
  'IntegrationConnection',
  'WarehouseMapping',
  'ChannelProduct',
  'ChannelVariant',
  'ChannelOrder',
  'Job',
  'JobRun',
  'Ticket',
  'AuditEvent',
  'Shipment',
  'ShipmentLine',
  'Return',
  'ReturnLine',
  'Customer',
  'Invoice',
  'InvoiceLine',
  'Mailbox',
  'EmailThread',
  'EmailMessage',
  'PluginInstallation',
]);

function findTenantInObject(value: any): string | null {
  if (!value || typeof value !== 'object') return null;
  if (typeof value.tenantId === 'string') return value.tenantId;
  for (const [key, val] of Object.entries(value)) {
    if (key.toLowerCase().includes('tenantid')) {
      if (typeof val === 'string') return val;
      if (val && typeof (val as any).tenantId === 'string') return (val as any).tenantId;
    }
    if (val && typeof val === 'object') {
      const nested = findTenantInObject(val);
      if (nested) return nested;
    }
  }
  return null;
}

function injectTenantWhere(where: any, tenantId: string) {
  if (!where || Object.keys(where).length === 0) return { tenantId };
  return { AND: [where, { tenantId }] };
}

function injectTenantData(data: any, tenantId: string) {
  if (!data) return { tenantId };
  if (Array.isArray(data)) {
    return data.map((d) => injectTenantData(d, tenantId));
  }
  if (data.tenantId && data.tenantId !== tenantId) {
    throw new HttpError(403, 'TENANT_MISMATCH', 'Tenant override not allowed');
  }
  return { ...data, tenantId };
}

export function applyTenantGuard(client: PrismaClient) {
  if ((client as any).__tenantGuardApplied) return client;
  (client as any).__tenantGuardApplied = true;

  client.$use(async (params, next) => {
    const { model, action, args } = params;
    if (!model || GLOBAL_MODELS.has(model) || !TENANT_MODELS.has(model)) {
      return next(params);
    }

    const ctx = getContext();
    const tenantFromArgs = findTenantInObject(args);
    const tenantId = ctx?.tenantId ?? tenantFromArgs;

    if (!tenantId) {
      throw new HttpError(400, 'TENANT_MISSING', `Tenant is required for ${model}.${action}`);
    }
    if (ctx?.tenantId && tenantFromArgs && ctx.tenantId !== tenantFromArgs) {
      throw new HttpError(403, 'TENANT_SCOPE_MISMATCH', 'Tenant in context and args differ');
    }

    const nextArgs: Prisma.MiddlewareParams['args'] = { ...args };

    switch (action) {
      case 'findMany':
      case 'findFirst':
        nextArgs.where = injectTenantWhere(args?.where, tenantId);
        break;
      case 'findUnique':
        if (findTenantInObject(args?.where)) {
          nextArgs.where = args?.where;
        } else {
          params.action = 'findFirst';
          nextArgs.where = injectTenantWhere(args?.where, tenantId);
        }
        break;
      case 'create':
      case 'createMany':
        nextArgs.data = injectTenantData(args?.data, tenantId);
        break;
      case 'upsert':
        if (!findTenantInObject(args?.where)) {
          throw new HttpError(400, 'TENANT_MISSING', `Missing tenant in where for ${model}.${action}`);
        }
        nextArgs.create = injectTenantData(args?.create, tenantId);
        nextArgs.update = args?.update;
        break;
      case 'update':
      case 'updateMany':
      case 'delete':
      case 'deleteMany':
        if (!findTenantInObject(args?.where)) {
          throw new HttpError(400, 'TENANT_MISSING', `Missing tenant in where for ${model}.${action}`);
        }
        nextArgs.where = injectTenantWhere(args?.where, tenantId);
        if (args?.data?.tenantId && args.data.tenantId !== tenantId) {
          throw new HttpError(403, 'TENANT_MISMATCH', 'Tenant override not allowed');
        }
        break;
      default:
        break;
    }

    try {
      return await next({ ...params, args: nextArgs });
    } catch (err: any) {
      logger.error('Tenant guard error', { model, action, message: err?.message });
      throw err;
    }
  });

  return client;
}
