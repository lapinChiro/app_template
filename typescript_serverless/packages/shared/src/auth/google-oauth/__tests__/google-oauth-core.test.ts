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

// Schema removed (unused)

type GoogleTokenResponse = z.infer<typeof _GoogleTokenResponseSchema>;

describe('GoogleOAuth - Core & Authorization', () => {
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

  describe('constructor', () => {
    it('should create instance with required config', () => {
      expect(googleOAuth).toBeDefined();
      expect(googleOAuth).toBeInstanceOf(GoogleOAuth);
    });

    it('should accept optional hostedDomain', () => {
      const configWithDomain = { ...mockConfig, hostedDomain: 'example.com' };
      const oauthWithDomain = new GoogleOAuth(configWithDomain);
      expect(oauthWithDomain).toBeDefined();
    });
  });

  describe('generateAuthorizationUrl', () => {
    it('should generate valid authorization URL with state', () => {
      const state = 'random-state-string';
      const authUrl = googleOAuth.generateAuthorizationUrl({ state });

      expect(authUrl).toMatch(/^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth/);
      expect(authUrl).toContain(`client_id=${mockConfig.clientId}`);
      expect(authUrl).toContain(`redirect_uri=${encodeURIComponent(mockConfig.redirectUri)}`);
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain(`state=${state}`);
      expect(authUrl).toContain('access_type=offline');
      expect(authUrl).toContain('scope=openid+email+profile');
    });

    it('should include PKCE parameters when provided', () => {
      const pkceParams = googleOAuth.generatePKCEParameters();
      const authUrl = googleOAuth.generateAuthorizationUrl({ 
        pkceParameters: pkceParams 
      });

      expect(authUrl).toContain(`code_challenge=${pkceParams.codeChallenge}`);
      expect(authUrl).toContain('code_challenge_method=S256');
    });

    it('should include custom scopes when provided', () => {
      const customScopes = ['https://www.googleapis.com/auth/drive.readonly'];
      const authUrl = googleOAuth.generateAuthorizationUrl({ 
        state: 'test',
        scopes: customScopes 
      });

      expect(authUrl).toContain('scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.readonly');
    });

    it('should include hosted domain when configured', () => {
      const oauthWithDomain = new GoogleOAuth({
        ...mockConfig,
        hostedDomain: 'example.com',
      });
      const authUrl = oauthWithDomain.generateAuthorizationUrl({ state: 'test' });

      expect(authUrl).toContain('hd=example.com');
    });

    it('should include nonce when provided', () => {
      const nonce = 'test-nonce-123';
      const authUrl = googleOAuth.generateAuthorizationUrl({ 
        state: 'test',
        nonce 
      });

      expect(authUrl).toContain(`nonce=${nonce}`);
    });

    it('should include prompt parameter when provided', () => {
      const authUrl = googleOAuth.generateAuthorizationUrl({ 
        state: 'test',
        prompt: 'consent' 
      });

      expect(authUrl).toContain('prompt=consent');
    });

    it('should include login hint when provided', () => {
      const loginHint = 'user@example.com';
      const authUrl = googleOAuth.generateAuthorizationUrl({ 
        state: 'test',
        loginHint 
      });

      expect(authUrl).toContain(`login_hint=${encodeURIComponent(loginHint)}`);
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('should exchange authorization code for tokens', async () => {
      const mockCode = 'test-authorization-code';
      const mockTokenResponse: GoogleTokenResponse = {
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

      const tokens = await googleOAuth.exchangeCodeForTokens(mockCode);

      expect(tokens).toEqual(mockTokenResponse);
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

    it('should include code verifier for PKCE flow', async () => {
      const mockCode = 'test-authorization-code';
      const mockCodeVerifier = 'test-code-verifier';
      const mockTokenResponse: GoogleTokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid email profile',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse),
      } as Response);

      await googleOAuth.exchangeCodeForTokens(mockCode, mockCodeVerifier);

      const fetchCall = ((global.fetch as unknown as { mock: { calls: Array<[string, RequestInit]> } }).mock.calls[0]);
      if (fetchCall) {
        expect(fetchCall[1].body).toContain(`code_verifier=${mockCodeVerifier}`);
      }
    });
  });
});