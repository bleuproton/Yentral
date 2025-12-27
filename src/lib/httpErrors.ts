export class HttpError extends Error {
  status: number;
  code: string;
  details?: any;

  constructor(status: number, code: string, message: string, details?: any) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function badRequest(message: string, details?: any) {
  return new HttpError(400, 'BAD_REQUEST', message, details);
}

export function unauthorized(message = 'Unauthorized', details?: any) {
  return new HttpError(401, 'UNAUTHORIZED', message, details);
}

export function forbidden(message = 'Forbidden', details?: any) {
  return new HttpError(403, 'FORBIDDEN', message, details);
}

export function notFound(message = 'Not found', details?: any) {
  return new HttpError(404, 'NOT_FOUND', message, details);
}
