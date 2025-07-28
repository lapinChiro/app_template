import { describe, it, expect } from 'vitest';

import type { User } from '../../../types/user';
import { UserSchema } from '../../user';

describe('UserSchema', () => {
  it('should validate a valid user object', () => {
    const validUser: User = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      name: 'Test User',
      role: 'member',
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    const result = UserSchema.parse(validUser);
    expect(result).toEqual(validUser);
  });

  it('should reject user with invalid email format', () => {
    const invalidUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'invalid-email',
      name: 'Test User',
      role: 'member',
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    expect(() => UserSchema.parse(invalidUser)).toThrow('Invalid email');
  });

  it('should reject user with invalid UUID', () => {
    const invalidUser = {
      id: 'not-a-uuid',
      email: 'test@example.com',
      name: 'Test User',
      role: 'member',
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    expect(() => UserSchema.parse(invalidUser)).toThrow('Invalid uuid');
  });

  it('should reject user with invalid role', () => {
    const invalidUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      name: 'Test User',
      role: 'invalid-role',
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    expect(() => UserSchema.parse(invalidUser)).toThrow();
  });

  it('should validate user with optional fields', () => {
    const userWithOptionals: User = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      name: 'Test User',
      role: 'member',
      profileImageUrl: 'https://example.com/image.jpg',
      googleId: 'google-123',
      lastLoginAt: '2024-01-01T00:00:00.000Z',
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    const result = UserSchema.parse(userWithOptionals);
    expect(result).toEqual(userWithOptionals);
  });
});