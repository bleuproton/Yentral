export const JobTypes = {
  SYNC_CONNECTION: 'SYNC_CONNECTION',
  SYNC_CATALOG: 'SYNC_CATALOG',
  SYNC_ORDERS: 'SYNC_ORDERS',
} as const;

export type JobType = (typeof JobTypes)[keyof typeof JobTypes];
