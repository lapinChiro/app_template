import { describe, it, expect } from 'vitest';

import type { UserActivity, UserStats } from '../../../types/user';
import { UserActivitySchema, UserStatsSchema } from '../../user';

describe('UserActivitySchema', () => {
  it('should validate user activity', () => {
    const activity: UserActivity = {
      userId: '123e4567-e89b-12d3-a456-426614174001',
      action: 'login',
      metadata: {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      },
      timestamp: '2024-01-01T00:00:00.000Z',
    };

    const result = UserActivitySchema.parse(activity);
    expect(result).toEqual(activity);
  });

  it('should validate different actions', () => {
    const actions = ['login', 'logout', 'profile_update', 'password_change'];

    actions.forEach((action) => {
      const activity: UserActivity = {
        userId: '123e4567-e89b-12d3-a456-426614174001',
        action,
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      expect(() => UserActivitySchema.parse(activity)).not.toThrow();
    });
  });

  it('should validate with optional fields', () => {
    const activity: UserActivity = {
      userId: '123e4567-e89b-12d3-a456-426614174001',
      action: 'resource_update',
      resource: 'user',
      resourceId: '123e4567-e89b-12d3-a456-426614174002',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      timestamp: '2024-01-01T00:00:00.000Z',
    };

    const result = UserActivitySchema.parse(activity);
    expect(result).toEqual(activity);
  });
});

describe('UserStatsSchema', () => {
  it('should validate user stats', () => {
    const stats: UserStats = {
      totalUsers: 100,
      activeUsers: 75,
      newUsersToday: 5,
      newUsersThisWeek: 20,
      newUsersThisMonth: 50,
      usersByRole: {
        admin: 2,
        member: 98,
      },
    };

    const result = UserStatsSchema.parse(stats);
    expect(result).toEqual(stats);
  });

  it('should reject negative numbers', () => {
    const invalidStats = {
      totalUsers: -1,
      activeUsers: 75,
      newUsersToday: 5,
      newUsersThisWeek: 20,
      newUsersThisMonth: 50,
      usersByRole: {
        admin: 2,
        member: 98,
      },
    };

    expect(() => UserStatsSchema.parse(invalidStats)).toThrow('Number must be greater than or equal to 0');
  });
});