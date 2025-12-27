import { Prisma, PrismaClient } from '@prisma/client';
import { GLOBAL_MODELS, prisma } from './prisma';
import { TenantScopeError } from '../http/errors';

function hasTenantWhere(where: any): boolean {
  if (!where || typeof where !== 'object') return false;
  if (Object.prototype.hasOwnProperty.call(where, 'tenantId')) return true;
  return Object.keys(where).some((k) => k.toLowerCase().includes('tenantid'));
}

function injectTenant(where: any, tenantId: string) {
  if (!where || Object.keys(where).length === 0) return { tenantId };
  return { AND: [where, { tenantId }] };
}

export function tenantDb(tenantId: string): PrismaClient {
  const extension = Prisma.defineExtension({
    query: {
      $allModels: {
        async findMany({ model, operation, args, query }) {
          if (GLOBAL_MODELS.has(model)) return query(args);
          const nextArgs = { ...args };
          nextArgs.where = injectTenant(args?.where, tenantId);
          return query(nextArgs);
        },
        async findFirst({ model, operation, args, query }) {
          if (GLOBAL_MODELS.has(model)) return query(args);
          const nextArgs = { ...args };
          nextArgs.where = injectTenant(args?.where, tenantId);
          return query(nextArgs);
        },
        async findUnique({ model, operation, args, query }) {
          if (GLOBAL_MODELS.has(model)) return query(args);
          if (!hasTenantWhere(args?.where)) {
            throw new TenantScopeError(`Missing tenantId in where for ${model}.${operation}`);
          }
          return query(args);
        },
        async create({ model, operation, args, query }) {
          if (GLOBAL_MODELS.has(model)) return query(args);
          const nextArgs = { ...args };
          if (Array.isArray(nextArgs.data)) {
            nextArgs.data = nextArgs.data.map((d: any) => {
              if (d.tenantId && d.tenantId !== tenantId) throw new TenantScopeError('Tenant mismatch on createMany');
              return { ...d, tenantId };
            });
          } else {
            if (nextArgs.data?.tenantId && nextArgs.data.tenantId !== tenantId) {
              throw new TenantScopeError('Tenant mismatch on create');
            }
            nextArgs.data = { ...nextArgs.data, tenantId };
          }
          return query(nextArgs);
        },
        async createMany({ model, operation, args, query }) {
          if (GLOBAL_MODELS.has(model)) return query(args);
          const nextArgs = { ...args };
          if (Array.isArray(nextArgs.data)) {
            nextArgs.data = nextArgs.data.map((d: any) => {
              if (d.tenantId && d.tenantId !== tenantId) throw new TenantScopeError('Tenant mismatch on createMany');
              return { ...d, tenantId };
            });
          }
          return query(nextArgs);
        },
        async update({ model, operation, args, query }) {
          if (GLOBAL_MODELS.has(model)) return query(args);
          if (!hasTenantWhere(args?.where)) throw new TenantScopeError(`Missing tenantId in where for ${model}.${operation}`);
          if (args?.data?.tenantId && args.data.tenantId !== tenantId) {
            throw new TenantScopeError('Tenant override on update');
          }
          return query(args);
        },
        async delete({ model, operation, args, query }) {
          if (GLOBAL_MODELS.has(model)) return query(args);
          if (!hasTenantWhere(args?.where)) throw new TenantScopeError(`Missing tenantId in where for ${model}.${operation}`);
          return query(args);
        },
        async upsert({ model, operation, args, query }) {
          if (GLOBAL_MODELS.has(model)) return query(args);
          if (!hasTenantWhere(args?.where)) throw new TenantScopeError(`Missing tenantId in where for ${model}.${operation}`);
          const nextArgs = { ...args };
          if (nextArgs.create?.tenantId && nextArgs.create.tenantId !== tenantId) {
            throw new TenantScopeError('Tenant override on upsert.create');
          }
          if (nextArgs.update?.tenantId && nextArgs.update.tenantId !== tenantId) {
            throw new TenantScopeError('Tenant override on upsert.update');
          }
          nextArgs.create = { ...nextArgs.create, tenantId };
          nextArgs.update = { ...nextArgs.update };
          return query(nextArgs);
        },
      },
    },
  });

  return prisma.$extends(extension) as unknown as PrismaClient;
}

export function unsafeDb(): PrismaClient {
  return prisma;
}
