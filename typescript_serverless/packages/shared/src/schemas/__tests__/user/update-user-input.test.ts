import { describe, it, expect } from 'vitest';

import type { UpdateUserInput } from '../../../types/user';
import { UpdateUserInputSchema } from '../../user';

describe('UpdateUserInputSchema', () => {
  it('should validate valid update user input', () => {
    const validInput: UpdateUserInput = {
      name: 'Updated Name',
    };

    const result = UpdateUserInputSchema.parse(validInput);
    expect(result).toEqual(validInput);
  });

  it('should validate empty update object', () => {
    const emptyInput: UpdateUserInput = {};

    const result = UpdateUserInputSchema.parse(emptyInput);
    expect(result).toEqual(emptyInput);
  });

  it('should validate all optional fields', () => {
    const fullInput: UpdateUserInput = {
      name: 'Updated Name',
      profileImageUrl: 'https://example.com/new-image.jpg',
      role: 'admin',
      isActive: false,
    };

    const result = UpdateUserInputSchema.parse(fullInput);
    expect(result).toEqual(fullInput);
  });

  it('should reject invalid URL for profileImageUrl', () => {
    const invalidInput = {
      profileImageUrl: 'not-a-url',
    };

    expect(() => UpdateUserInputSchema.parse(invalidInput)).toThrow('Invalid url');
  });
});