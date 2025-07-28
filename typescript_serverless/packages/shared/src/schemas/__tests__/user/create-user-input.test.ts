import { describe, it, expect } from 'vitest';

import type { CreateUserInput } from '../../../types/user';
import { CreateUserInputSchema } from '../../user';

describe('CreateUserInputSchema', () => {
  it('should validate valid create user input', () => {
    const validInput: CreateUserInput = {
      email: 'new@example.com',
      name: 'New User',
    };

    const result = CreateUserInputSchema.parse(validInput);
    expect(result).toEqual(validInput);
  });

  it('should validate create user input with optional fields', () => {
    const inputWithOptionals: CreateUserInput = {
      email: 'new@example.com',
      name: 'New User',
      role: 'admin',
      googleId: 'google-456',
    };

    const result = CreateUserInputSchema.parse(inputWithOptionals);
    expect(result).toEqual(inputWithOptionals);
  });

  it('should reject empty name', () => {
    const invalidInput = {
      email: 'new@example.com',
      name: '',
    };

    expect(() => CreateUserInputSchema.parse(invalidInput)).toThrow('String must contain at least 1 character(s)');
  });

  it('should reject names that are too long', () => {
    const invalidInput = {
      email: 'new@example.com',
      name: 'a'.repeat(256),
    };

    expect(() => CreateUserInputSchema.parse(invalidInput)).toThrow();
  });
});