import { describe, it, expect } from 'vitest';

import type { UserPreferences, NotificationPreferences } from '../../../types/user';
import { UserPreferencesSchema, NotificationPreferencesSchema } from '../../user';

describe('NotificationPreferencesSchema', () => {
  it('should validate notification preferences with all false', () => {
    const prefs: NotificationPreferences = {
      email: false,
      push: false,
      marketing: false,
    };

    const result = NotificationPreferencesSchema.parse(prefs);
    expect(result).toEqual(prefs);
  });

  it('should validate notification preferences with mixed values', () => {
    const prefs: NotificationPreferences = {
      email: true,
      push: false,
      marketing: true,
    };

    const result = NotificationPreferencesSchema.parse(prefs);
    expect(result).toEqual(prefs);
  });
});

describe('UserPreferencesSchema', () => {
  it('should validate user preferences', () => {
    const prefs: UserPreferences = {
      userId: '123e4567-e89b-12d3-a456-426614174001',
      theme: 'dark',
      language: 'ja',
      notifications: {
        email: true,
        push: false,
        marketing: false,
      },
    };

    const result = UserPreferencesSchema.parse(prefs);
    expect(result).toEqual(prefs);
  });

  it('should reject invalid theme', () => {
    const invalidPrefs = {
      userId: '123e4567-e89b-12d3-a456-426614174001',
      theme: 'invalid-theme',
      language: 'en',
      notifications: {
        email: true,
        push: false,
        marketing: false,
      },
    };

    expect(() => UserPreferencesSchema.parse(invalidPrefs)).toThrow();
  });

  it('should reject invalid language code', () => {
    const invalidPrefs = {
      userId: '123e4567-e89b-12d3-a456-426614174001',
      theme: 'light',
      language: 'invalid',
      notifications: {
        email: true,
        push: false,
        marketing: false,
      },
    };

    expect(() => UserPreferencesSchema.parse(invalidPrefs)).toThrow();
  });
});