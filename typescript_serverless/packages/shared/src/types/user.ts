import type { UserRole } from './api';
import type { HasId, HasTimestamps, HasSoftDelete } from './common';

// User entity
export interface User extends HasId, HasTimestamps {
  email: string;
  name: string;
  role: UserRole;
  profileImageUrl?: string;
  googleId?: string;
  lastLoginAt?: string;
  isActive: boolean;
}

// User with soft delete
export interface UserWithSoftDelete extends User, HasSoftDelete {}

// User creation
export interface CreateUserInput {
  email: string;
  name: string;
  role?: UserRole;
  googleId?: string;
}

// User update
export interface UpdateUserInput {
  name?: string;
  profileImageUrl?: string;
  role?: UserRole;
  isActive?: boolean;
}

// User profile
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  profileImageUrl?: string;
  role: UserRole;
  createdAt: string;
}

// User session
export interface UserSession {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
  expiresAt: string;
}

// User preferences
export interface UserPreferences {
  userId: string;
  theme?: 'light' | 'dark' | 'system';
  language?: 'ja' | 'en';
  notifications?: NotificationPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  marketing: boolean;
}

// User activity
export interface UserActivity {
  userId: string;
  action: string;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

// User statistics
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  usersByRole: Record<UserRole, number>;
}