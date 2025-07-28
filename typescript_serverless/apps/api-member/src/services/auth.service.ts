import { LoginRequest, LoginResponse } from '../types/auth.types';
import { UnauthorizedError } from '../errors/auth.errors';

export interface IAuthService {
  login(credentials: LoginRequest): Promise<LoginResponse>;
}

export class AuthService implements IAuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // TODO: Replace with real authentication logic
    // This is a temporary implementation for testing
    if (
      credentials.email === 'test@example.com' &&
      credentials.password === 'correctpassword'
    ) {
      return {
        token: `mock-jwt-token-${Date.now()}`,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
      };
    }

    throw new UnauthorizedError();
  }
}