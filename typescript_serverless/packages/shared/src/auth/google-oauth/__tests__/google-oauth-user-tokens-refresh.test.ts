import { describe, it, expect, beforeEach, vi } from 'vitest';

import { GoogleOAuth } from '../google-oauth';

// Mock TokenValidator at the module level
vi.mock('../token-validator', () => ({
  TokenValidator: {
    verifyIdToken: vi.fn(),
  },
}));

describe('GoogleOAuth - Token Refresh & Revocation', () => {
  const mockClientId = 'test-client-id.apps.googleusercontent.com';
  const mockClientSecret = 'test-client-secret';
  const mockRedirectUri = 'https://example.com/callback';
  let googleOAuth: GoogleOAuth;

  beforeEach(() => {
    googleOAuth = new GoogleOAuth({
      clientId: mockClientId,
      clientSecret: mockClientSecret,
      redirectUri: mockRedirectUri,
    });
    vi.clearAllMocks();
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token using refresh token', async () => {
      const mockRefreshToken = 'test-refresh-token';
      const mockTokenResponse = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid email profile',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse),
      } as Response);

      const tokenData = await googleOAuth.refreshAccessToken(mockRefreshToken);

      expect(tokenData).toEqual(mockTokenResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
          }) as Headers,
          body: expect.stringContaining(`refresh_token=${mockRefreshToken}`) as string,
        })
      );
    });

    it('should throw error when refresh token is invalid', async () => {
      const mockRefreshToken = 'invalid-refresh-token';

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'invalid_grant' }),
      } as Response);

      await expect(googleOAuth.refreshAccessToken(mockRefreshToken)).rejects.toThrow(
        'invalid_grant'
      );
    });
  });

  describe('revokeToken', () => {
    it('should revoke access token successfully', async () => {
      const mockToken = 'test-access-token';

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
      } as Response);

      await googleOAuth.revokeToken(mockToken);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/revoke',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
          }) as Headers,
          body: expect.stringContaining(`token=${mockToken}`) as string,
        })
      );
    });

    it('should throw error when revoke fails', async () => {
      const mockToken = 'test-access-token';

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(googleOAuth.revokeToken(mockToken)).rejects.toThrow(
        'Failed to revoke token'
      );
    });
  });

  describe('verifyIdToken', () => {
    it('should validate and decode ID token', async () => {
      const { TokenValidator } = await import('../token-validator');
      const mockIdToken = 'header.payload.signature';
      const mockPayload = {
        iss: 'https://accounts.google.com',
        sub: '123456789',
        azp: mockClientId,
        aud: mockClientId,
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        email: 'test@example.com',
        email_verified: true,
      };

      vi.mocked(TokenValidator.verifyIdToken).mockResolvedValue(mockPayload);

      const payload = await googleOAuth.verifyIdToken(mockIdToken);

      expect(payload).toBeDefined();
      expect(payload).toEqual(mockPayload);
    });

    it('should throw error for invalid ID token format', async () => {
      const { TokenValidator } = await import('../token-validator');
      const invalidIdToken = 'invalid-format';

      vi.mocked(TokenValidator.verifyIdToken).mockRejectedValue(
        new Error('Invalid ID token format')
      );

      await expect(googleOAuth.verifyIdToken(invalidIdToken))
        .rejects.toThrow('Invalid ID token format');
    });

    it('should throw error for expired ID token', async () => {
      const { TokenValidator } = await import('../token-validator');
      const mockIdToken = 'header.payload.signature';

      vi.mocked(TokenValidator.verifyIdToken).mockRejectedValue(
        new Error('ID token has expired')
      );

      await expect(googleOAuth.verifyIdToken(mockIdToken))
        .rejects.toThrow('expired');
    });
  });
});