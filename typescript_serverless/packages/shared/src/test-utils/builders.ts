import type { ApiResponse, ApiError, TokenPair, UserRole } from '../types/api';
import type { PaginatedResponse } from '../types/common';
import type { User } from '../types/user';
import { randomString } from '../utils/string';

/**
 * Test data builder for User entities
 */
export class UserBuilder {
  private readonly user: Partial<User> = {};

  withId(id: string): this {
    this.user.id = id;
    return this;
  }

  withEmail(email: string): this {
    this.user.email = email;
    return this;
  }

  withName(name: string): this {
    this.user.name = name;
    return this;
  }

  withRole(role: UserRole): this {
    this.user.role = role;
    return this;
  }

  withGoogleId(googleId: string): this {
    this.user.googleId = googleId;
    return this;
  }

  withProfileImageUrl(url: string): this {
    this.user.profileImageUrl = url;
    return this;
  }

  withActive(isActive: boolean): this {
    this.user.isActive = isActive;
    return this;
  }

  withTimestamps(createdAt?: string, updatedAt?: string): this {
    const now = new Date().toISOString();
    this.user.createdAt = createdAt ?? now;
    this.user.updatedAt = updatedAt ?? now;
    return this;
  }

  build(): User {
    const now = new Date().toISOString();
    const user: User = {
      id: this.user.id ?? `user-${randomString(8)}`,
      email: this.user.email ?? 'test@example.com',
      name: this.user.name ?? 'Test User',
      role: this.user.role ?? 'member',
      isActive: this.user.isActive ?? true,
      createdAt: this.user.createdAt ?? now,
      updatedAt: this.user.updatedAt ?? now,
    };

    if (this.user.googleId !== undefined) {
      user.googleId = this.user.googleId;
    }
    if (this.user.profileImageUrl !== undefined) {
      user.profileImageUrl = this.user.profileImageUrl;
    }

    return user;
  }
}

/**
 * Test data builder for API responses
 */
export class ApiResponseBuilder<T> {
  private readonly response: Partial<ApiResponse<T>> = {};

  withData(data: T): this {
    this.response.data = data;
    return this;
  }

  withSuccess(success: boolean): this {
    this.response.success = success;
    return this;
  }

  withMessage(message: string): this {
    this.response.message = message;
    return this;
  }

  build(): ApiResponse<T> {
    const response: ApiResponse<T> = {
      data: this.response.data as T,
      success: this.response.success ?? true,
      timestamp: new Date().toISOString(),
    };

    if (this.response.message !== undefined) {
      response.message = this.response.message;
    }

    return response;
  }
}

/**
 * Test data builder for API errors
 */
export class ApiErrorBuilder {
  private readonly error: Partial<ApiError> = {};

  withCode(code: string): this {
    this.error.code = code;
    return this;
  }

  withMessage(message: string): this {
    this.error.message = message;
    return this;
  }

  withDetails(details: Record<string, unknown>): this {
    this.error.details = details;
    return this;
  }

  build(): ApiError {
    const error: ApiError = {
      code: this.error.code ?? 'TEST_ERROR',
      message: this.error.message ?? 'Test error message',
    };

    if (this.error.details !== undefined) {
      error.details = this.error.details;
    }

    return error;
  }
}

/**
 * Test data builder for paginated responses
 */
export class PaginatedResponseBuilder<T> {
  private readonly response: Partial<PaginatedResponse<T>> = {};

  withItems(items: T[]): this {
    this.response.items = items;
    return this;
  }

  withPagination(page: number, limit: number, total: number): this {
    this.response.page = page;
    this.response.limit = limit;
    this.response.total = total;
    this.response.pages = Math.ceil(total / limit);
    this.response.hasNext = page < this.response.pages;
    this.response.hasPrev = page > 1;
    return this;
  }

  build(): PaginatedResponse<T> {
    const page = this.response.page ?? 1;
    const limit = this.response.limit ?? 10;
    const total = this.response.total ?? this.response.items?.length ?? 0;
    const pages = Math.ceil(total / limit);

    return {
      items: this.response.items ?? [],
      page,
      limit,
      total,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    };
  }
}

/**
 * Test data builder for token pairs
 */
export class TokenPairBuilder {
  private readonly tokens: Partial<TokenPair> = {};

  withAccessToken(token: string): this {
    this.tokens.accessToken = token;
    return this;
  }

  withRefreshToken(token: string): this {
    this.tokens.refreshToken = token;
    return this;
  }

  build(): TokenPair {
    return {
      accessToken: this.tokens.accessToken ?? `access-${randomString(32)}`,
      refreshToken: this.tokens.refreshToken ?? `refresh-${randomString(32)}`,
    };
  }
}

// Convenience functions for quick test data creation
export const createTestUser = (overrides?: Partial<User>): User => {
  return new UserBuilder()
    .withEmail(overrides?.email ?? 'test@example.com')
    .withName(overrides?.name ?? 'Test User')
    .withRole(overrides?.role ?? 'member')
    .build();
};

export const createAdminUser = (overrides?: Partial<User>): User => {
  return new UserBuilder()
    .withEmail(overrides?.email ?? 'admin@example.com')
    .withName(overrides?.name ?? 'Admin User')
    .withRole('admin')
    .build();
};