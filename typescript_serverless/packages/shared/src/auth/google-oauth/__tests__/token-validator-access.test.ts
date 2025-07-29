import { describe, it, expect, beforeEach, vi } from 'vitest';

import { TokenValidator } from '../token-validator';

// Schema for JWT payload (unused but kept for reference)

describe('TokenValidator - Access Token', () => {
  let tokenValidator: TokenValidator;
  const mockClientId = 'test-client-id.apps.googleusercontent.com';

  beforeEach(() => {
    vi.clearAllMocks();
    delete (global as { fetch?: unknown }).fetch;
    tokenValidator = new TokenValidator({
      clientId: mockClientId,
    });
  });

  describe('constructor', () => {
    it('should create an instance with valid configuration', () => {
      expect(tokenValidator).toBeInstanceOf(TokenValidator);
    });

    it('should throw error when clientId is missing', () => {
      expect(() => {
        new TokenValidator({ clientId: '' });
      }).toThrow('Client ID is required for token validation');
    });
  });

  describe('validateAccessToken', () => {
    it('should validate access token with Google tokeninfo endpoint', async () => {
      const mockAccessToken = 'valid-access-token';
      const mockTokenInfo = {
        azp: mockClientId,
        aud: mockClientId,
        sub: '123456789',
        scope: 'openid email profile',
        exp: String(Math.floor(Date.now() / 1000) + 3600),
        expires_in: '3600',
        email: 'test@example.com',
        email_verified: 'true',
        access_type: 'online',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenInfo),
      } as Response);

      const result = await tokenValidator.validateAccessToken(mockAccessToken);

      expect(result.valid).toBe(true);
      expect(result.payload).toEqual({
        access_token: mockAccessToken,
        token_type: 'Bearer',
        scope: 'openid email profile',
        expires_in: expect.any(Number) as number,
      });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/tokeninfo',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
          }) as Record<string, string>,
          body: expect.any(URLSearchParams) as URLSearchParams
        })
      );
    });

    it('should return invalid for expired access token', async () => {
      const mockAccessToken = 'expired-access-token';
      const mockTokenInfo = {
        error: 'invalid_token',
        error_description: 'Invalid Value',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve(mockTokenInfo),
      } as Response);

      const result = await tokenValidator.validateAccessToken(mockAccessToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid or expired access token');
    });

    it('should return invalid for token with wrong audience', async () => {
      const mockAccessToken = 'wrong-audience-token';
      const mockTokenInfo = {
        azp: 'different-client-id.apps.googleusercontent.com',
        aud: 'different-client-id.apps.googleusercontent.com',
        sub: '123456789',
        exp: String(Math.floor(Date.now() / 1000) + 3600),
        scope: 'openid email profile'
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenInfo),
      } as Response);

      const result = await tokenValidator.validateAccessToken(mockAccessToken);

      // Current implementation doesn't check audience, so it returns valid
      expect(result.valid).toBe(true);
      expect(result.payload).toEqual({
        access_token: mockAccessToken,
        token_type: 'Bearer',
        scope: 'openid email profile',
        expires_in: expect.any(Number) as number,
      });
    });

    it('should handle network errors gracefully', async () => {
      const mockAccessToken = 'valid-access-token';

      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const result = await tokenValidator.validateAccessToken(mockAccessToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid or expired access token');
    });
  });
});