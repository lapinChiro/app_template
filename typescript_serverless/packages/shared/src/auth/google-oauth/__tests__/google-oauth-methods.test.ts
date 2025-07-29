import { describe, it, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';

import { GoogleOAuth } from '../google-oauth';

// Mock TokenValidator at the module level
vi.mock('../token-validator', () => ({
  TokenValidator: {
    verifyIdToken: vi.fn(),
  },
}));

// Test data schemas - _GoogleTokenResponseSchema removed (unused)

const _GoogleUserInfoSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  verified_email: z.boolean(),
  name: z.string(),
  given_name: z.string().optional(),
  family_name: z.string().optional(),
  picture: z.string().url().optional(),
  locale: z.string().optional(),
});

type GoogleUserInfo = z.infer<typeof _GoogleUserInfoSchema>;

describe('GoogleOAuth - Methods & User Operations', () => {
  const mockConfig = {
    clientId: 'test-client-id.apps.googleusercontent.com',
    clientSecret: 'test-client-secret',
    redirectUri: 'https://example.com/callback',
  };
  let googleOAuth: GoogleOAuth;

  beforeEach(() => {
    googleOAuth = new GoogleOAuth(mockConfig);
    vi.clearAllMocks();
  });

  describe('getUserInfo', () => {
    it('should fetch user info with valid access token', async () => {
      const mockAccessToken = 'test-access-token';
      const mockUserInfo: GoogleUserInfo = {
        id: '123456789',
        email: 'test@example.com',
        verified_email: true,
        name: 'Test User',
        given_name: 'Test',
        family_name: 'User',
        picture: 'https://example.com/photo.jpg',
        locale: 'en',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserInfo),
      } as Response);

      const userInfo = await googleOAuth.getUserInfo(mockAccessToken);

      expect(userInfo).toEqual(mockUserInfo);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockAccessToken}`,
          }) as Headers,
        })
      );
    });

    it('should throw error for invalid access token', async () => {
      const mockAccessToken = 'invalid-access-token';

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      await expect(googleOAuth.getUserInfo(mockAccessToken)).rejects.toThrow(
        'Access token is invalid or expired'
      );
    });

    it('should validate user info schema', async () => {
      const mockAccessToken = 'test-access-token';
      const invalidUserInfo = {
        id: '123456789',
        // Missing required fields
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidUserInfo),
      } as Response);

      await expect(googleOAuth.getUserInfo(mockAccessToken)).rejects.toThrow(
        'Invalid user info response from Google'
      );
    });
  });

  // Moved to google-oauth-token-management.test.ts

  describe('verifyIdToken', () => {
    it('should verify ID token', async () => {
      const { TokenValidator } = await import('../token-validator');
      const mockIdToken = 'header.payload.signature';
      const mockPayload = {
        iss: 'https://accounts.google.com',
        sub: '123456789',
        azp: mockConfig.clientId,
        aud: mockConfig.clientId,
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        email: 'test@example.com',
        email_verified: true,
      };

      vi.mocked(TokenValidator.verifyIdToken).mockResolvedValue(mockPayload);

      const payload = await googleOAuth.verifyIdToken(mockIdToken);

      expect(payload).toBeDefined();
    });

    it('should verify ID token with nonce', async () => {
      const { TokenValidator } = await import('../token-validator');
      const mockIdToken = 'header.payload.signature';
      const mockNonce = 'test-nonce';
      const mockPayload = {
        iss: 'https://accounts.google.com',
        sub: '123456789',
        azp: mockConfig.clientId,
        aud: mockConfig.clientId,
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        nonce: mockNonce,
        email: 'test@example.com',
        email_verified: true,
      };

      vi.mocked(TokenValidator.verifyIdToken).mockResolvedValue(mockPayload);

      const payload = await googleOAuth.verifyIdToken(mockIdToken, mockNonce);

      expect(payload).toBeDefined();
    });
  });

  // Moved to google-oauth-token-management.test.ts
});