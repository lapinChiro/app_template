import { describe, it, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';

import { GoogleOAuth } from '../google-oauth';

// Test data schemas
const _GoogleTokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  refresh_token: z.string().optional(),
  scope: z.string(),
  id_token: z.string().optional(),
});

type GoogleTokenResponse = z.infer<typeof _GoogleTokenResponseSchema>;

describe('GoogleOAuth - Token Management', () => {
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

  describe('refreshAccessToken', () => {
    it('should refresh access token using refresh token', async () => {
      const mockRefreshToken = 'test-refresh-token';
      const mockTokenResponse: GoogleTokenResponse = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid email profile',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse),
      } as Response);

      const tokens = await googleOAuth.refreshAccessToken(mockRefreshToken);

      expect(tokens).toEqual(mockTokenResponse);
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

    it('should throw error for invalid refresh token', async () => {
      const mockRefreshToken = 'invalid-refresh-token';

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'invalid_grant' }),
      } as Response);

      await expect(googleOAuth.refreshAccessToken(mockRefreshToken)).rejects.toThrow();
    });
  });

  describe('revokeToken', () => {
    it('should revoke token successfully', async () => {
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

    it('should not throw error for 400 status (already revoked)', async () => {
      const mockToken = 'already-revoked-token';

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as Response);

      await expect(googleOAuth.revokeToken(mockToken)).resolves.not.toThrow();
    });

    it('should throw error for other failures', async () => {
      const mockToken = 'test-token';

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

  describe('generatePKCEParameters', () => {
    it('should generate valid PKCE parameters', () => {
      const pkceParams = googleOAuth.generatePKCEParameters();

      expect(pkceParams).toHaveProperty('codeVerifier');
      expect(pkceParams).toHaveProperty('codeChallenge');
      expect(pkceParams).toHaveProperty('state');

      // Code verifier should be a base64url string
      expect(pkceParams.codeVerifier).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(pkceParams.codeVerifier.length).toBeGreaterThanOrEqual(43);
      expect(pkceParams.codeVerifier.length).toBeLessThanOrEqual(128);

      // Code challenge should be a base64url string
      expect(pkceParams.codeChallenge).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(pkceParams.codeChallenge.length).toBe(43);

      // State should be a base64url string
      expect(pkceParams.state).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should generate different parameters each time', () => {
      const params1 = googleOAuth.generatePKCEParameters();
      const params2 = googleOAuth.generatePKCEParameters();

      expect(params1.codeVerifier).not.toBe(params2.codeVerifier);
      expect(params1.codeChallenge).not.toBe(params2.codeChallenge);
      expect(params1.state).not.toBe(params2.state);
    });
  });
});