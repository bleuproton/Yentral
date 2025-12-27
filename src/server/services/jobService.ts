// @ts-nocheck
import { RequestContext } from '../tenant/context';
import { JobRepo } from '../repos/jobRepo';

export class JobService {
  private repo = new JobRepo();

  enqueue(ctx: RequestContext, data: any) {
    return this.repo.enqueueJob(ctx, data);
  }

  list(ctx: RequestContext, filters: any) {
    return this.repo.listJobs(ctx, filters);
  }
}
