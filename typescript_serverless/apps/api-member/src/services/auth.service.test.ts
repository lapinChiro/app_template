import { AuthService } from './auth.service';
import { UnauthorizedError } from '../errors/auth.errors';
import { LoginRequest } from '../types/auth.types';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('login', () => {
    it('should return login response for valid credentials', async () => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'correctpassword',
      };

      const result = await authService.login(credentials);

      expect(result).toMatchObject({
        token: expect.stringMatching(/^mock-jwt-token-\d+$/),
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
      });
    });

    it('should throw UnauthorizedError for invalid credentials', async () => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await expect(authService.login(credentials)).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for non-existent user', async () => {
      const credentials: LoginRequest = {
        email: 'nonexistent@example.com',
        password: 'anypassword',
      };

      await expect(authService.login(credentials)).rejects.toThrow(UnauthorizedError);
    });
  });
});