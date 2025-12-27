// @ts-nocheck
import { NextRequest } from 'next/server';
import { buildContext } from '@/server/tenant/buildContext';
import { jsonOk, jsonError, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { IntegrationRepo } from '@/server/repos/integrationRepo';
import { IntegrationConnectionCreateSchema } from '@/server/validators/integration';

export async function GET(req: NextRequest) {
  try {
    const ctx = await buildContext(req);
    const repo = new IntegrationRepo();
    const connections = await repo.listConnections(ctx);
    return jsonOk(connections);
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await buildContext(req);
    requireWriteAccess(ctx, 'integration.write');
    const body = IntegrationConnectionCreateSchema.parse(await parseJson(req));
    const repo = new IntegrationRepo();
    const connection = await repo.createConnection(ctx, {
      connectorVersionId: body.connectorVersionId,
      name: body.name ?? null,
      region: body.region ?? null,
      status: body.status as any,
      config: body.config ?? null,
    } as any);
    return jsonOk(connection, 201);
  } catch (err) {
    return jsonError(err);
  }
}
