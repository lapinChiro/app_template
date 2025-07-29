import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import type { TokenValidator } from '../google-oauth/token-validator';

export interface NextAuthMiddlewareConfig {
  tokenValidator: TokenValidator;
  publicPaths: string[];
  loginPath?: string;
  tokenRefreshThreshold?: number; // seconds before expiry to trigger refresh
}

export function createNextAuthMiddleware(config: NextAuthMiddlewareConfig) {
  const { 
    tokenValidator, 
    publicPaths, 
    loginPath = '/login',
    tokenRefreshThreshold = 300 // 5 minutes
  } = config;

  return async function middleware(request: NextRequest): Promise<NextResponse> {
    // Check if path is public
    const isPublicPath = publicPaths.some(path => 
      request.nextUrl.pathname.startsWith(path)
    );
    
    if (isPublicPath) {
      return NextResponse.next();
    }

    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL(loginPath, request.url));
    }

    try {
      // Verify token
      const payload = await tokenValidator.verifyIdToken(token);
      
      if (!payload) {
        return NextResponse.redirect(new URL(loginPath, request.url));
      }

      // Check if token needs refresh (within threshold of expiry)
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - now;
      
      if (timeUntilExpiry < tokenRefreshThreshold) {
        // TODO: Implement token refresh logic
        // This would typically involve:
        // 1. Using a refresh token to get a new access token
        // 2. Setting the new token in the response cookies
        // For now, we'll just add a header to indicate refresh is needed
        const response = NextResponse.next();
        response.headers.set('X-Token-Refresh-Needed', 'true');
        return response;
      }

      return NextResponse.next();
    } catch {
      // Auth middleware error - redirecting to login
      return NextResponse.redirect(new URL(loginPath, request.url));
    }
  };
}

// Recommended matcher configuration
export const authMiddlewareConfig = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};