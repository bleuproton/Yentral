// @ts-nocheck
import { NextRequest } from 'next/server';
import { buildContext } from '@/server/tenant/buildContext';
import { jsonOk, jsonError, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { IntegrationRepo } from '@/server/repos/integrationRepo';
import { IntegrationConnectionUpdateSchema } from '@/server/validators/integration';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await buildContext(req);
    const repo = new IntegrationRepo();
    const connection = await repo.getConnection(ctx, params.id);
    return jsonOk(connection);
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await buildContext(req);
    requireWriteAccess(ctx, 'integration.write');
    const body = IntegrationConnectionUpdateSchema.parse(await parseJson(req));
    const repo = new IntegrationRepo();
    const updated = await repo.updateConnection(ctx, params.id, {
      name: body.name ?? undefined,
      region: body.region ?? undefined,
      status: body.status as any,
      config: body.config ?? undefined,
    } as any);
    return jsonOk(updated);
  } catch (err) {
    return jsonError(err);
  }
}
