import { describe, it, expect, vi, beforeEach } from 'vitest';

import { TokenValidator } from '../token-validator';
import type { IdTokenPayload } from '../types';

// Mock TokenValidator
vi.mock('../token-validator', () => ({
  TokenValidator: vi.fn().mockImplementation(() => ({
    validateIdToken: vi.fn(),
  })),
}));


describe('TokenValidator - Hosted Domain Validation', () => {
  const mockClientId = 'test-client-id.apps.googleusercontent.com';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hosted domain validation', () => {
    it('should validate ID token with hosted domain', async () => {
      const hostedDomain = 'example.com';
      const validator = new TokenValidator({
        clientId: mockClientId,
        hostedDomain,
      });

      const mockIdToken = 'header.payload.signature';
      const mockPayload: IdTokenPayload = {
        iss: 'https://accounts.google.com',
        sub: '123456789',
        aud: mockClientId,
        azp: mockClientId,
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        email: 'test@example.com',
        email_verified: true,
        hd: hostedDomain,
      };

      vi.mocked(validator.validateIdToken).mockResolvedValue({
        valid: true,
        payload: mockPayload,
      });

      const result = await validator.validateIdToken(mockIdToken);

      expect(result.valid).toBe(true);
      expect(result.payload).toEqual(mockPayload);
    });

    it('should reject ID token with wrong hosted domain', async () => {
      const hostedDomain = 'example.com';
      const validator = new TokenValidator({
        clientId: mockClientId,
        hostedDomain,
      });

      const mockIdToken = 'header.payload.signature';
      vi.mocked(validator.validateIdToken).mockResolvedValue({
        valid: false,
        error: 'Email domain must be example.com',
      });

      const result = await validator.validateIdToken(mockIdToken);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('domain');
    });

    it('should accept ID token without hosted domain when none is configured', async () => {
      const validator = new TokenValidator({
        clientId: mockClientId,
      });

      const mockIdToken = 'header.payload.signature';
      const mockPayload: IdTokenPayload = {
        iss: 'https://accounts.google.com',
        sub: '123456789',
        aud: mockClientId,
        azp: mockClientId,
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        email: 'test@gmail.com',
        email_verified: true,
      };

      vi.mocked(validator.validateIdToken).mockResolvedValue({
        valid: true,
        payload: mockPayload,
      });

      const result = await validator.validateIdToken(mockIdToken);

      expect(result.valid).toBe(true);
      expect(result.payload).toEqual(mockPayload);
    });
  });
});