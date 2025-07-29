import { describe, it, expect } from 'vitest';

import { GoogleUserInfoMapper } from '../user-info-mapper';

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

describe('UserInfoMapper - Locales & Special Characters', () => {
  const mapper = new GoogleUserInfoMapper();

  describe('locale handling', () => {
    it('should preserve locale information', () => {
      const googleUserInfo: GoogleUserInfo = {
        id: '123',
        email: 'user@example.com',
        verified_email: true,
        name: 'Test User',
        locale: 'ja-JP',
      };

      const internalUser = mapper.mapToInternalUser(googleUserInfo) as { id: string; email: string; emailVerified: boolean; name: string; firstName?: string; lastName?: string; avatarUrl?: string; locale?: string; provider: string; hostedDomain?: string };

      expect(internalUser.locale).toBe('ja-JP');
    });

    it('should handle various locale formats', () => {
      const locales = ['en-US', 'en', 'zh-CN', 'pt-BR', 'fr-CA'];

      locales.forEach(locale => {
        const googleUserInfo: GoogleUserInfo = {
          id: '123',
          email: 'user@example.com',
          verified_email: true,
          name: 'Test User',
          locale,
        };

        const internalUser = mapper.mapToInternalUser(googleUserInfo) as { id: string; email: string; emailVerified: boolean; name: string; firstName?: string; lastName?: string; avatarUrl?: string; locale?: string; provider: string; hostedDomain?: string };

        expect(internalUser.locale).toBe(locale);
      });
    });
  });

  describe('special character handling', () => {
    it('should preserve unicode characters in names', () => {
      const googleUserInfo: GoogleUserInfo = {
        id: '123',
        email: 'user@example.com',
        verified_email: true,
        name: 'José García',
        given_name: 'José',
        family_name: 'García',
      };

      const internalUser = mapper.mapToInternalUser(googleUserInfo) as { id: string; email: string; emailVerified: boolean; name: string; firstName?: string; lastName?: string; avatarUrl?: string; locale?: string; provider: string; hostedDomain?: string };

      expect(internalUser.name).toBe('José García');
      expect(internalUser.firstName).toBe('José');
      expect(internalUser.lastName).toBe('García');
    });

    it('should handle names with apostrophes', () => {
      const googleUserInfo: GoogleUserInfo = {
        id: '123',
        email: 'user@example.com',
        verified_email: true,
        name: "O'Brien",
        family_name: "O'Brien",
      };

      const internalUser = mapper.mapToInternalUser(googleUserInfo) as { id: string; email: string; emailVerified: boolean; name: string; firstName?: string; lastName?: string; avatarUrl?: string; locale?: string; provider: string; hostedDomain?: string };

      expect(internalUser.name).toBe("O'Brien");
      expect(internalUser.lastName).toBe("O'Brien");
    });

    it('should handle hyphenated names', () => {
      const googleUserInfo: GoogleUserInfo = {
        id: '123',
        email: 'user@example.com',
        verified_email: true,
        name: 'Mary-Jane Watson-Parker',
        given_name: 'Mary-Jane',
        family_name: 'Watson-Parker',
      };

      const internalUser = mapper.mapToInternalUser(googleUserInfo) as { id: string; email: string; emailVerified: boolean; name: string; firstName?: string; lastName?: string; avatarUrl?: string; locale?: string; provider: string; hostedDomain?: string };

      expect(internalUser.firstName).toBe('Mary-Jane');
      expect(internalUser.lastName).toBe('Watson-Parker');
    });
  });

  describe('picture URL handling', () => {
    it('should preserve Google profile picture URLs', () => {
      const googleUserInfo: GoogleUserInfo = {
        id: '123',
        email: 'user@example.com',
        verified_email: true,
        name: 'Test User',
        picture: 'https://lh3.googleusercontent.com/a/ACg8ocKtest123',
      };

      const internalUser = mapper.mapToInternalUser(googleUserInfo) as { id: string; email: string; emailVerified: boolean; name: string; firstName?: string; lastName?: string; avatarUrl?: string; locale?: string; provider: string; hostedDomain?: string };

      expect((internalUser as { avatarUrl?: string }).avatarUrl).toBe('https://lh3.googleusercontent.com/a/ACg8ocKtest123');
    });

    it('should handle missing picture gracefully', () => {
      const googleUserInfo: GoogleUserInfo = {
        id: '123',
        email: 'user@example.com',
        verified_email: true,
        name: 'Test User',
      };

      const internalUser = mapper.mapToInternalUser(googleUserInfo) as { id: string; email: string; emailVerified: boolean; name: string; firstName?: string; lastName?: string; avatarUrl?: string; locale?: string; provider: string; hostedDomain?: string; };

      expect((internalUser as { avatarUrl?: string }).avatarUrl).toBeUndefined();
    });
  });
});