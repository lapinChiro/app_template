import type { UserRepository } from '../../repositories/user.repository';
import type { TokenValidator } from '../google-oauth/token-validator';

import { authMiddleware } from './auth-middleware';
import type { AuthMiddleware } from './types';

export interface GuardConfig {
  tokenValidator: TokenValidator;
  userRepository: UserRepository;
}

/**
 * Creates a guard that requires authentication
 */
export function createRequireAuth(config: GuardConfig): AuthMiddleware {
  return authMiddleware({
    tokenValidator: config.tokenValidator,
    userLookup: async (payload) => {
      const user = await config.userRepository.findByGoogleId(payload.sub);
      if (!user?.googleId) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        googleId: user.googleId,
        role: user.role,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
        ...(user.profileImageUrl && { picture: user.profileImageUrl }),
      };
    },
  });
}

/**
 * Creates a guard that requires admin role
 */
export function createRequireAdmin(config: GuardConfig): AuthMiddleware {
  return authMiddleware({
    tokenValidator: config.tokenValidator,
    requiredRole: 'admin',
    userLookup: async (payload) => {
      const user = await config.userRepository.findByGoogleId(payload.sub);
      if (!user?.googleId) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        googleId: user.googleId,
        role: user.role,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
        ...(user.profileImageUrl && { picture: user.profileImageUrl }),
      };
    },
  });
}

/**
 * Creates a guard that requires member or admin role
 */
export function createRequireMember(config: GuardConfig): AuthMiddleware {
  return authMiddleware({
    tokenValidator: config.tokenValidator,
    userLookup: async (payload) => {
      const user = await config.userRepository.findByGoogleId(payload.sub);
      if (!user?.googleId) {
        return null;
      }
      // Admin can access member routes
      if (user.role !== 'member' && user.role !== 'admin') {
        // Return null to trigger 401 since user doesn't have correct role
        return null;
      }
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        googleId: user.googleId,
        role: user.role,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
        ...(user.profileImageUrl && { picture: user.profileImageUrl }),
      };
    },
  });
}