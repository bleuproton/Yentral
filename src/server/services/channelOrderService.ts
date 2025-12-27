import { RequestContext } from '../tenant/context';
import { MappingRepo } from '../repos/mappingRepo';

export class ChannelOrderService {
  private repo = new MappingRepo();

  linkOrder(ctx: RequestContext, connectionId: string, externalOrderId: string, orderId: string, raw?: any) {
    return this.repo.linkChannelOrder(ctx, connectionId, externalOrderId, orderId, raw);
  }
}
