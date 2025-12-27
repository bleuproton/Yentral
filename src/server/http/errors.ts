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
