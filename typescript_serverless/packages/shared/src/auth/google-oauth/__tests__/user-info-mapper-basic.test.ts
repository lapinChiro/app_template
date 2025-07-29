import { describe, it, expect } from 'vitest';

import { GoogleUserInfoMapper } from '../user-info-mapper';

// Schema removed (unused)

type GoogleUserInfo = {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
  hd?: string;
};

describe('UserInfoMapper - Basic Mapping', () => {
  const mapper = new GoogleUserInfoMapper();

  describe('mapToInternalUser', () => {
    it('should map basic Google user info to internal format', () => {
      const googleUserInfo: GoogleUserInfo = {
        id: '123456789',
        email: 'test@example.com',
        verified_email: true,
        name: 'Test User',
        given_name: 'Test',
        family_name: 'User',
        picture: 'https://example.com/photo.jpg',
        locale: 'en',
      };

      const internalUser = mapper.mapToInternalUser(googleUserInfo) as { id: string; email: string; emailVerified: boolean; name: string; firstName?: string; lastName?: string; avatarUrl?: string; locale?: string; provider: string; hostedDomain?: string };

      expect(internalUser).toMatchObject({
        googleId: '123456789',
        email: 'test@example.com',
        emailVerified: true,
        name: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: 'https://example.com/photo.jpg',
        locale: 'en',
        provider: 'google',
      });
      expect(internalUser.id).toBeDefined();
      expect(typeof internalUser.id).toBe('string');
    });

    it('should handle missing optional fields', () => {
      const googleUserInfo: GoogleUserInfo = {
        id: '123456789',
        email: 'test@example.com',
        verified_email: true,
        name: 'Test User',
      };

      const internalUser = mapper.mapToInternalUser(googleUserInfo) as { id: string; email: string; emailVerified: boolean; name: string; firstName?: string; lastName?: string; avatarUrl?: string; locale?: string; provider: string; hostedDomain?: string };

      expect(internalUser).toMatchObject({
        googleId: '123456789',
        email: 'test@example.com',
        emailVerified: true,
        name: 'Test User',
        provider: 'google',
      });
      expect(internalUser.id).toBeDefined();
      expect(typeof internalUser.id).toBe('string');
      expect(internalUser.firstName).toBeUndefined();
      expect(internalUser.lastName).toBeUndefined();
      expect(internalUser.avatarUrl).toBeUndefined();
      expect(internalUser.locale).toBeUndefined();
    });

    it('should include hosted domain when present', () => {
      const googleUserInfo: GoogleUserInfo = {
        id: '123456789',
        email: 'test@company.com',
        verified_email: true,
        name: 'Test User',
        hd: 'company.com',
      };

      const internalUser = mapper.mapToInternalUser(googleUserInfo) as { id: string; email: string; emailVerified: boolean; name: string; firstName?: string; lastName?: string; avatarUrl?: string; locale?: string; provider: string; hostedDomain?: string };

      expect(internalUser.hostedDomain).toBe('company.com');
    });

    it('should convert verified_email to emailVerified', () => {
      const googleUserInfo: GoogleUserInfo = {
        id: '123456789',
        email: 'test@example.com',
        verified_email: false,
        name: 'Test User',
      };

      const internalUser = mapper.mapToInternalUser(googleUserInfo) as { id: string; email: string; emailVerified: boolean; name: string; firstName?: string; lastName?: string; avatarUrl?: string; locale?: string; provider: string; hostedDomain?: string };

      expect(internalUser.emailVerified).toBe(false);
    });

    it('should always set provider to google', () => {
      const googleUserInfo: GoogleUserInfo = {
        id: '123456789',
        email: 'test@example.com',
        verified_email: true,
        name: 'Test User',
      };

      const internalUser = mapper.mapToInternalUser(googleUserInfo) as { id: string; email: string; emailVerified: boolean; name: string; firstName?: string; lastName?: string; avatarUrl?: string; locale?: string; provider: string; hostedDomain?: string };

      expect(internalUser.provider).toBe('google');
    });
  });

  describe('edge cases', () => {
    it('should handle users with only given_name', () => {
      const googleUserInfo: GoogleUserInfo = {
        id: '123456789',
        email: 'test@example.com',
        verified_email: true,
        name: 'Test',
        given_name: 'Test',
      };

      const internalUser = mapper.mapToInternalUser(googleUserInfo) as { id: string; email: string; emailVerified: boolean; name: string; firstName?: string; lastName?: string; avatarUrl?: string; locale?: string; provider: string; hostedDomain?: string };

      expect(internalUser.firstName).toBe('Test');
      expect(internalUser.lastName).toBeUndefined();
    });

    it('should handle users with only family_name', () => {
      const googleUserInfo: GoogleUserInfo = {
        id: '123456789',
        email: 'test@example.com',
        verified_email: true,
        name: 'User',
        family_name: 'User',
      };

      const internalUser = mapper.mapToInternalUser(googleUserInfo) as { id: string; email: string; emailVerified: boolean; name: string; firstName?: string; lastName?: string; avatarUrl?: string; locale?: string; provider: string; hostedDomain?: string };

      expect(internalUser.firstName).toBeUndefined();
      expect(internalUser.lastName).toBe('User');
    });

    it('should handle users with single word names', () => {
      const googleUserInfo: GoogleUserInfo = {
        id: '123456789',
        email: 'madonna@example.com',
        verified_email: true,
        name: 'Madonna',
        given_name: 'Madonna',
      };

      const internalUser = mapper.mapToInternalUser(googleUserInfo) as { id: string; email: string; emailVerified: boolean; name: string; firstName?: string; lastName?: string; avatarUrl?: string; locale?: string; provider: string; hostedDomain?: string };

      expect(internalUser.firstName).toBe('Madonna');
      expect(internalUser.lastName).toBeUndefined();
    });
  });

  describe('normalizeUserInfo', () => {
    it('should normalize email to lowercase', () => {
      const googleUserInfo: GoogleUserInfo = {
        id: '123',
        email: 'Test.User@EXAMPLE.COM',
        verified_email: true,
        name: 'Test User',
      };

      const internalUser = mapper.mapToInternalUser(googleUserInfo) as { id: string; email: string; emailVerified: boolean; name: string; firstName?: string; lastName?: string; avatarUrl?: string; locale?: string; provider: string; hostedDomain?: string };

      expect(internalUser.email).toBe('test.user@example.com');
    });

    it('should trim whitespace from name fields', () => {
      const googleUserInfo: GoogleUserInfo = {
        id: '123',
        email: 'test@example.com',
        verified_email: true,
        name: '  Test User  ',
        given_name: '  Test  ',
        family_name: '  User  ',
      };

      const internalUser = mapper.mapToInternalUser(googleUserInfo) as { id: string; email: string; emailVerified: boolean; name: string; firstName?: string; lastName?: string; avatarUrl?: string; locale?: string; provider: string; hostedDomain?: string };

      expect(internalUser.name).toBe('Test User');
      expect(internalUser.firstName).toBe('Test');
      expect(internalUser.lastName).toBe('User');
    });
  });
});