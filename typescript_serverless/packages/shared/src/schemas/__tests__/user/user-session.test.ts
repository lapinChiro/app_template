import { describe, it, expect } from 'vitest';

import type { UserSession } from '../../../types/user';
import { UserSessionSchema } from '../../user';

describe('UserSessionSchema', () => {
  it('should validate valid user session', () => {
    const validSession: UserSession = {
      userId: '123e4567-e89b-12d3-a456-426614174001',
      email: 'user@example.com',
      role: 'member',
      sessionId: 'session-123',
      expiresAt: '2024-12-31T23:59:59.999Z',
    };

    const result = UserSessionSchema.parse(validSession);
    expect(result).toEqual(validSession);
  });

  it('should reject session with invalid timestamp', () => {
    const invalidSession = {
      userId: '123e4567-e89b-12d3-a456-426614174001',
      email: 'user@example.com',
      role: 'member',
      sessionId: 'session-123',
      expiresAt: 'not-a-timestamp',
    };

    expect(() => UserSessionSchema.parse(invalidSession)).toThrow();
  });
});