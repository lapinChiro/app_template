import { describe, it, expect, beforeEach, vi } from 'vitest';

import { TokenValidator } from '../token-validator';

// Schema removed (unused in tests)

describe('TokenValidator - ID Token', () => {
  let tokenValidator: TokenValidator;
  const mockClientId = 'test-client-id.apps.googleusercontent.com';

  beforeEach(() => {
    tokenValidator = new TokenValidator({
      clientId: mockClientId,
    });
    vi.clearAllMocks();
  });

  describe('validateIdToken', () => {
    it('should validate properly formatted ID token', async () => {
      const mockIdToken = 'header.payload.signature';
      const mockPayload = {
        iss: 'https://accounts.google.com',
        sub: '123456789',
        aud: mockClientId,
        azp: mockClientId,
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        email: 'test@example.com',
        email_verified: true,
        name: 'Test User',
      };

      // Mock JWT verification
      vi.spyOn(TokenValidator, 'verifyIdToken').mockResolvedValue(mockPayload as never);

      const result = await tokenValidator.validateIdToken(mockIdToken);

      expect(result.valid).toBe(true);
      expect(result.payload).toEqual(mockPayload);
    });

    it('should reject ID token with invalid format', async () => {
      const invalidIdToken = 'invalid-format';
      
      const OAuthError = await import('../oauth-errors').then(m => m.OAuthError);
      const OAuthErrorCode = await import('../oauth-errors').then(m => m.OAuthErrorCode);
      
      vi.spyOn(TokenValidator, 'verifyIdToken').mockRejectedValue(
        new OAuthError(
          OAuthErrorCode.INVALID_TOKEN,
          'Invalid token format',
          401
        )
      );

      const result = await tokenValidator.validateIdToken(invalidIdToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid ID token format');
    });

    it('should reject ID token with wrong issuer', async () => {
      const mockIdToken = 'header.payload.signature';
      const OAuthError = await import('../oauth-errors').then(m => m.OAuthError);
      const OAuthErrorCode = await import('../oauth-errors').then(m => m.OAuthErrorCode);
      
      vi.spyOn(TokenValidator, 'verifyIdToken').mockRejectedValue(
        new OAuthError(
          OAuthErrorCode.INVALID_TOKEN,
          'Invalid token issuer',
          401
        )
      );

      const result = await tokenValidator.validateIdToken(mockIdToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid ID token format');
    });

    it('should reject expired ID token', async () => {
      const mockIdToken = 'header.payload.signature';
      const OAuthError = await import('../oauth-errors').then(m => m.OAuthError);
      const OAuthErrorCode = await import('../oauth-errors').then(m => m.OAuthErrorCode);
      
      vi.spyOn(TokenValidator, 'verifyIdToken').mockRejectedValue(
        new OAuthError(
          OAuthErrorCode.TOKEN_EXPIRED,
          'ID token has expired',
          401
        )
      );

      const result = await tokenValidator.validateIdToken(mockIdToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('ID token has expired');
    });

    it('should reject ID token with wrong audience', async () => {
      const mockIdToken = 'header.payload.signature';
      
      vi.spyOn(TokenValidator, 'verifyIdToken').mockRejectedValue(
        new Error('Audience validation failed')
      );

      const result = await tokenValidator.validateIdToken(mockIdToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid ID token');
    });

    it('should validate ID token with array audience containing clientId', async () => {
      const mockIdToken = 'header.payload.signature';
      const mockPayload = {
        iss: 'https://accounts.google.com',
        sub: '123456789',
        aud: ['other-client-id', mockClientId, 'another-client-id'],
        azp: mockClientId,
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        email: 'test@example.com',
        email_verified: true,
      };

      vi.spyOn(TokenValidator, 'verifyIdToken').mockResolvedValue(mockPayload as never);

      const result = await tokenValidator.validateIdToken(mockIdToken);

      expect(result.valid).toBe(true);
    });

    // Moved to token-validator-nonce.test.ts

    // Moved to token-validator-domain.test.ts
  });

  // Moved to token-validator-certificates.test.ts
});