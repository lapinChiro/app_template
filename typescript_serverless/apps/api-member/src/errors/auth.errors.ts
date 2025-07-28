export class AuthError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly errorType: string,
    message: string,
    public readonly details?: Record<string, string>
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class ValidationError extends AuthError {
  constructor(message: string, details?: Record<string, string>) {
    super(400, 'Bad Request', message, details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message: string = 'Invalid credentials') {
    super(401, 'Unauthorized', message);
    this.name = 'UnauthorizedError';
  }
}

export class MethodNotAllowedError extends AuthError {
  constructor(method: string) {
    super(405, 'Method Not Allowed', `${method} method is not supported`);
    this.name = 'MethodNotAllowedError';
  }
}