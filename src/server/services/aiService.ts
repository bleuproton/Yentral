import { isFeatureEnabled } from '@/config/featureFlags';

export class AiService {
  constructor(private tenantId: string, private actorUserId: string) {}

  ensure(feature: string) {
    if (!isFeatureEnabled(this.tenantId, feature)) {
      throw new Error('Feature disabled');
    }
  }

  listingOptimizer(payload: { title?: string; description?: string }) {
    this.ensure('ai-listing');
    return {
      suggestedTitle: payload.title ? `${payload.title} (optimized)` : 'Optimized title',
      suggestedDescription: payload.description ? `${payload.description} (improved)` : 'Improved description',
    };
  }

  supportTriage(payload: { body?: string }) {
    this.ensure('ai-support');
    return {
      priority: 'MEDIUM',
      responseTemplate: 'Thank you for reaching out. We are looking into this.',
    };
  }

  inventoryAnomaly(payload: { deltas?: number[] }) {
    this.ensure('ai-inventory');
    const anomalies = (payload.deltas || []).filter((d) => Math.abs(d) > 50);
    return { anomalies };
  }
}
