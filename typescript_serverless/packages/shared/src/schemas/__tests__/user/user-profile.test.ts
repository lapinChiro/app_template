import { describe, it, expect } from 'vitest';

import type { UserProfile } from '../../../types/user';
import { UserProfileSchema } from '../../user';

describe('UserProfileSchema', () => {
  it('should validate valid user profile', () => {
    const validProfile: UserProfile = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      name: 'Test User',
      profileImageUrl: 'https://example.com/image.jpg',
      role: 'member',
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    const result = UserProfileSchema.parse(validProfile);
    expect(result).toEqual(validProfile);
  });

  it('should validate profile without optional fields', () => {
    const minimalProfile: UserProfile = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      name: 'Test User',
      role: 'member',
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    const result = UserProfileSchema.parse(minimalProfile);
    expect(result).toEqual(minimalProfile);
  });
});