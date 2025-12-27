export function logInfo(tenantId: string, jobId: string, correlationId: string, message: string, meta: any = {}) {
  console.info(JSON.stringify({ level: 'info', tenantId, jobId, correlationId, message, ...meta }));
}

export function logError(tenantId: string, jobId: string, correlationId: string, message: string, meta: any = {}) {
  console.error(JSON.stringify({ level: 'error', tenantId, jobId, correlationId, message, ...meta }));
}
