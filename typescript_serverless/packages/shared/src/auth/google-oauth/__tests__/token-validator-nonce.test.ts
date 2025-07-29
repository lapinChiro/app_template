import { describe, it, expect, beforeEach, vi } from 'vitest';

import { TokenValidator } from '../token-validator';

// Schema removed (unused in tests)

describe('TokenValidator - Nonce Validation', () => {
  let tokenValidator: TokenValidator;
  const mockClientId = 'test-client-id.apps.googleusercontent.com';

  beforeEach(() => {
    tokenValidator = new TokenValidator({
      clientId: mockClientId,
    });
    vi.clearAllMocks();
  });

  describe('nonce validation', () => {
    it('should validate nonce if provided', async () => {
      const mockIdToken = 'header.payload.signature';
      const mockNonce = 'test-nonce-123';
      const mockPayload = {
        iss: 'https://accounts.google.com',
        sub: '123456789',
        aud: mockClientId,
        azp: mockClientId,
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        email: 'test@example.com',
        email_verified: true,
        nonce: mockNonce,
      };

      vi.spyOn(TokenValidator, 'verifyIdToken').mockResolvedValue(mockPayload as never);

      const result = await tokenValidator.validateIdToken(mockIdToken, mockNonce);

      expect(result.valid).toBe(true);
    });

    it('should reject if nonce does not match', async () => {
      const mockIdToken = 'header.payload.signature';
      const OAuthError = await import('../oauth-errors').then(m => m.OAuthError);
      const OAuthErrorCode = await import('../oauth-errors').then(m => m.OAuthErrorCode);
      
      vi.spyOn(TokenValidator, 'verifyIdToken').mockRejectedValue(
        new OAuthError(
          OAuthErrorCode.INVALID_TOKEN,
          'Nonce mismatch',
          401
        )
      );

      const result = await tokenValidator.validateIdToken(mockIdToken, 'expected-nonce');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid ID token format');
    });

    it('should accept token without nonce when none is expected', async () => {
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
      };

      vi.spyOn(TokenValidator, 'verifyIdToken').mockResolvedValue(mockPayload as never);

      const result = await tokenValidator.validateIdToken(mockIdToken);

      expect(result.valid).toBe(true);
    });
  });
});