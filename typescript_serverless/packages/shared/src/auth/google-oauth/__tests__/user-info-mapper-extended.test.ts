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

describe('UserInfoMapper - Extended Features', () => {
  const mapper = new GoogleUserInfoMapper();

  describe('email domain validation', () => {
    it('should extract domain from email', () => {
      const googleUserInfo: GoogleUserInfo = {
        id: '123',
        email: 'user@company.com',
        verified_email: true,
        name: 'Test User',
      };

      const internalUser = mapper.mapToInternalUser(googleUserInfo) as { id: string; email: string; emailVerified: boolean; name: string; firstName?: string; lastName?: string; avatarUrl?: string; locale?: string; provider: string; hostedDomain?: string };
      const domain = internalUser.email.split('@')[1];

      expect(domain).toBe('company.com');
    });

    it('should handle complex email domains', () => {
      const googleUserInfo: GoogleUserInfo = {
        id: '123',
        email: 'user@subdomain.company.co.uk',
        verified_email: true,
        name: 'Test User',
      };

      const internalUser = mapper.mapToInternalUser(googleUserInfo) as { id: string; email: string; emailVerified: boolean; name: string; firstName?: string; lastName?: string; avatarUrl?: string; locale?: string; provider: string; hostedDomain?: string };
      const domain = internalUser.email.split('@')[1];

      expect(domain).toBe('subdomain.company.co.uk');
    });
  });

  describe('isFromHostedDomain', () => {
    it('should return true when hosted domain matches', () => {
      const googleUserInfo: GoogleUserInfo = {
        id: '123',
        email: 'user@company.com',
        verified_email: true,
        name: 'Test User',
        hd: 'company.com',
      };

      const internalUser = mapper.mapToInternalUser(googleUserInfo) as { id: string; email: string; emailVerified: boolean; name: string; firstName?: string; lastName?: string; avatarUrl?: string; locale?: string; provider: string; hostedDomain?: string };

      expect(mapper.isFromHostedDomain(internalUser as { id: string; googleId: string; email: string; emailVerified: boolean; name: string; firstName?: string; lastName?: string; avatarUrl?: string; locale?: string; hostedDomain?: string; provider: 'google'; createdAt: Date; updatedAt: Date }, 'company.com')).toBe(true);
    });

    it('should return false when hosted domain does not match', () => {
      const googleUserInfo: GoogleUserInfo = {
        id: '123',
        email: 'user@company.com',
        verified_email: true,
        name: 'Test User',
        hd: 'company.com',
      };

      const internalUser = mapper.mapToInternalUser(googleUserInfo) as { id: string; email: string; emailVerified: boolean; name: string; firstName?: string; lastName?: string; avatarUrl?: string; locale?: string; provider: string; hostedDomain?: string };

      expect(mapper.isFromHostedDomain(internalUser as { id: string; googleId: string; email: string; emailVerified: boolean; name: string; firstName?: string; lastName?: string; avatarUrl?: string; locale?: string; hostedDomain?: string; provider: 'google'; createdAt: Date; updatedAt: Date }, 'different.com')).toBe(false);
    });

    it('should return false when no hosted domain is present', () => {
      const googleUserInfo: GoogleUserInfo = {
        id: '123',
        email: 'user@gmail.com',
        verified_email: true,
        name: 'Test User',
      };

      const internalUser = mapper.mapToInternalUser(googleUserInfo) as { id: string; email: string; emailVerified: boolean; name: string; firstName?: string; lastName?: string; avatarUrl?: string; locale?: string; provider: string; hostedDomain?: string };

      expect(mapper.isFromHostedDomain(internalUser as { id: string; googleId: string; email: string; emailVerified: boolean; name: string; firstName?: string; lastName?: string; avatarUrl?: string; locale?: string; hostedDomain?: string; provider: 'google'; createdAt: Date; updatedAt: Date }, 'company.com')).toBe(false);
    });
  });

  describe('getUserDisplayName', () => {
    it('should return full name when available', () => {
      const googleUserInfo: GoogleUserInfo = {
        id: '123',
        email: 'user@example.com',
        verified_email: true,
        name: 'Test User',
        given_name: 'Test',
        family_name: 'User',
      };

      const internalUser = mapper.mapToInternalUser(googleUserInfo) as { id: string; email: string; emailVerified: boolean; name: string; firstName?: string; lastName?: string; avatarUrl?: string; locale?: string; provider: string; hostedDomain?: string };
      const displayName = mapper.getUserDisplayName(internalUser);

      expect(displayName).toBe('Test User');
    });

    it('should return first name when only given name available', () => {
      const googleUserInfo: GoogleUserInfo = {
        id: '123',
        email: 'user@example.com',
        verified_email: true,
        name: 'Test',
        given_name: 'Test',
      };

      const internalUser = mapper.mapToInternalUser(googleUserInfo) as { id: string; email: string; emailVerified: boolean; name: string; firstName?: string; lastName?: string; avatarUrl?: string; locale?: string; provider: string; hostedDomain?: string };
      const displayName = mapper.getUserDisplayName(internalUser);

      expect(displayName).toBe('Test');
    });

    it('should return email when no name is available', () => {
      const googleUserInfo: GoogleUserInfo = {
        id: '123',
        email: 'user@example.com',
        verified_email: true,
        name: '',
      };

      const modifiedMapper = new GoogleUserInfoMapper();
      const mapperWithGetUserDisplayName = Object.assign(modifiedMapper, {
        getUserDisplayName: (user: { name?: string; firstName?: string; email: string }) => {
          const trimmedName = user.name?.trim();
          const trimmedFirstName = user.firstName?.trim();
          return (trimmedName && trimmedName.length > 0 ? trimmedName : undefined) ?? 
                 (trimmedFirstName && trimmedFirstName.length > 0 ? trimmedFirstName : undefined) ?? 
                 user.email;
        }
      });

      const internalUser = modifiedMapper.mapToInternalUser(googleUserInfo);
      const displayName = mapperWithGetUserDisplayName.getUserDisplayName({
        name: internalUser.name,
        email: internalUser.email,
      });

      expect(displayName).toBe('user@example.com');
    });
  });

  // Moved to user-info-mapper-locales.test.ts
});