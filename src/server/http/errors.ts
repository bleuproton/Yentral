export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: any;
  constructor(statusCode: number, code: string, message: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class AuthRequiredError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, 'AUTH_REQUIRED', message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class TenantRequiredError extends AppError {
  constructor(message = 'Tenant required') {
    super(400, 'TENANT_REQUIRED', message);
  }
}

export class ForbiddenTenantError extends AppError {
  constructor(message = 'Forbidden for tenant') {
    super(403, 'TENANT_FORBIDDEN', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(404, 'NOT_FOUND', message);
  }
}

export class TenantScopeError extends AppError {
  constructor(message = 'Missing or invalid tenant scope') {
    super(403, 'TENANT_SCOPE', message);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(400, 'BAD_REQUEST', message);
  }
}

export const badRequest = (message = 'Bad request') => new BadRequestError(message);
export const unauthorized = (message = 'Unauthorized') => new UnauthorizedError(message);
export const forbidden = (message = 'Forbidden') => new ForbiddenError(message);
export const notFound = (message = 'Not found') => new NotFoundError(message);

export function toHttpResponse(err: any) {
  if (err instanceof AppError) {
    return { status: err.statusCode, body: { ok: false, error: { code: err.code, message: err.message } } };
  }
  return { status: 500, body: { ok: false, error: { code: 'INTERNAL_ERROR', message: err?.message ?? 'Internal error' } } };
}
