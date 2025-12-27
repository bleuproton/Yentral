// @ts-nocheck
import { MediaRepository } from '../repositories/mediaRepository';
import { prisma } from '../db';
import { withContext } from '../tenant/als';
import { RequestContext } from '../tenant/context';

export class MediaService {
  private repo(ctx: RequestContext) {
    return new MediaRepository(prisma, ctx.tenantId);
  }

  registerAsset(ctx: RequestContext, input: { url: string; provider: string; mimeType?: string; checksum?: string }) {
    return withContext(ctx, () => this.repo(ctx).createAsset(input));
  }

  listProductMedia(ctx: RequestContext, productId: string) {
    return withContext(ctx, () => this.repo(ctx).listProductMedia(productId));
  }

  attachToProduct(ctx: RequestContext, productId: string, assetId: string, altText?: string, sortOrder = 0) {
    return withContext(ctx, () => this.repo(ctx).attachProductMedia(productId, assetId, altText, sortOrder));
  }

  detachFromProduct(ctx: RequestContext, productId: string, assetId: string) {
    return withContext(ctx, () => this.repo(ctx).detachProductMedia(productId, assetId));
  }
}
