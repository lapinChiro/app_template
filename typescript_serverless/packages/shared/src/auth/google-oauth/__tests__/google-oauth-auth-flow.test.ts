import { describe, it, expect, beforeEach, vi } from 'vitest';

import { GoogleOAuth } from '../google-oauth';

// Test data schemas (unused but kept for reference)

describe('GoogleOAuth - Authorization Flow', () => {
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

  describe('generateAuthorizationUrl', () => {
    it('should generate valid authorization URL with required parameters', () => {
      const state = 'random-state-string';
      const authUrl = googleOAuth.generateAuthorizationUrl({ state });

      expect(authUrl).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(authUrl).toContain(`client_id=${mockClientId}`);
      expect(authUrl).toContain(`redirect_uri=${encodeURIComponent(mockRedirectUri)}`);
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain(`state=${state}`);
      expect(authUrl).toContain('scope=openid+email+profile');
    });

    it('should include custom scopes when provided', () => {
      const state = 'random-state-string';
      const customScopes = ['https://www.googleapis.com/auth/drive.readonly'];
      const authUrl = googleOAuth.generateAuthorizationUrl({ state, scopes: customScopes });

      expect(authUrl).toContain('scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.readonly');
    });

    it('should include PKCE parameters when provided', () => {
      const pkceParameters = googleOAuth.generatePKCEParameters();
      const authUrl = googleOAuth.generateAuthorizationUrl({ pkceParameters });

      expect(authUrl).toContain(`code_challenge=${pkceParameters.codeChallenge}`);
      expect(authUrl).toContain('code_challenge_method=S256');
    });

    it('should include prompt parameter when provided', () => {
      const state = 'random-state-string';
      const authUrl = googleOAuth.generateAuthorizationUrl({ state, prompt: 'consent' });

      expect(authUrl).toContain('prompt=consent');
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('should exchange authorization code for access token', async () => {
      const mockCode = 'test-authorization-code';
      const mockTokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'test-refresh-token',
        scope: 'openid email profile',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse),
      } as Response);

      const tokenData = await googleOAuth.exchangeCodeForTokens(mockCode);

      expect(tokenData).toEqual(mockTokenResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
          }) as Headers,
          body: expect.stringContaining(`code=${mockCode}`) as string,
        })
      );
    });

    it('should throw error when token exchange fails', async () => {
      const mockCode = 'test-authorization-code';

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ error: 'invalid_grant' }),
      } as Response);

      await expect(googleOAuth.exchangeCodeForTokens(mockCode)).rejects.toThrow();
    });

    it('should validate token response schema', async () => {
      const mockCode = 'test-authorization-code';
      const invalidTokenResponse = {
        // Missing required fields
        token_type: 'Bearer',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidTokenResponse),
      } as Response);

      await expect(googleOAuth.exchangeCodeForTokens(mockCode)).rejects.toThrow();
    });
  });
});