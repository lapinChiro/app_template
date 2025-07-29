import { describe, it, expect, vi, beforeEach } from 'vitest';

import { TokenValidator } from '../token-validator';

describe('TokenValidator - Certificates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (global as { fetch?: unknown }).fetch;
  });
  describe('getCertificates', () => {
    it('should fetch Google signing certificates', async () => {
      const mockCerts = {
        'key1': '-----BEGIN CERTIFICATE-----\nMIIDJzCCAg...\n-----END CERTIFICATE-----',
        'key2': '-----BEGIN CERTIFICATE-----\nMIIDJzCCAh...\n-----END CERTIFICATE-----',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCerts),
      } as Response);

      const certs = await TokenValidator.getCertificates();

      expect(certs).toEqual(mockCerts);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/oauth2/v3/certs'
      );
    });

    it('should throw error when fetching certificates fails', async () => {
      // Clear cache to ensure fresh request
      // @ts-expect-error accessing private property for testing
      TokenValidator.stringCertCache = null;

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(TokenValidator.getCertificates()).rejects.toThrow(
        'Failed to fetch Google certificates'
      );
    });

    it('should cache certificates', async () => {
      const mockCerts = {
        'key1': '-----BEGIN CERTIFICATE-----\nMIIDJzCCAg...\n-----END CERTIFICATE-----',
      };

      // Clear any existing cache first
      // @ts-expect-error accessing private property for testing
      TokenValidator.stringCertCache = null;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCerts),
      } as Response);

      // First call
      const certs1 = await TokenValidator.getCertificates();
      expect(certs1).toEqual(mockCerts);

      // Second call should use cache
      const certs2 = await TokenValidator.getCertificates();
      expect(certs2).toEqual(mockCerts);

      // Fetch should only be called once due to caching
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});