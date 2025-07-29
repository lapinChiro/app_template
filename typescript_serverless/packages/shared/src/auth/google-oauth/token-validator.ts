import * as jose from 'jose';
import { z } from 'zod';

import { OAuthError, OAuthErrorCode } from './oauth-errors';
import type { IdTokenPayload, GoogleAuthConfig } from './types';

export class TokenValidator {
  private static readonly GOOGLE_ISSUER = 'https://accounts.google.com';
  private static readonly GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
  private static certCache: { jwks: jose.JSONWebKeySet; expiry: number } | null = null;
  private static stringCertCache: { certs: Record<string, string>; expiry: number } | null = null;
  private readonly clientId: string;
  private readonly hostedDomain?: string;

  constructor(config: { clientId: string; hostedDomain?: string }) {
    if (!config.clientId) {
      throw new Error('Client ID is required for token validation');
    }
    this.clientId = config.clientId;
    if (config.hostedDomain) {
      this.hostedDomain = config.hostedDomain;
    }
  }

  static async verifyIdToken(
    idToken: string,
    config: GoogleAuthConfig,
    nonce?: string
  ): Promise<IdTokenPayload> {
    try {
      const JWKS = jose.createRemoteJWKSet(new URL(this.GOOGLE_CERTS_URL));

      const { payload } = await jose.jwtVerify(idToken, JWKS, {
        issuer: this.GOOGLE_ISSUER,
        audience: config.clientId,
      });

      const validatedPayload = this.validateIdTokenPayload(payload);

      this.validateTokenClaims(validatedPayload, config, nonce);

      return validatedPayload;
    } catch (error) {
      return this.handleTokenVerificationError(error);
    }
  }

  static async verifyAccessToken(
    accessToken: string
  ): Promise<{ active: boolean; scope?: string; exp?: number }> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/tokeninfo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          access_token: accessToken,
        }),
      });

      if (!response.ok) {
        const error = await response.json() as {error?: string};
        if (error.error === 'invalid_token') {
          return { active: false };
        }
        throw new Error('Token introspection failed');
      }

      const tokenInfo = await response.json() as {scope?: string; exp?: string};
      const result: { active: boolean; scope?: string; exp?: number } = {
        active: true,
      };
      if (tokenInfo.scope) result.scope = tokenInfo.scope;
      if (tokenInfo.exp) result.exp = parseInt(tokenInfo.exp);
      return result;
    } catch (error) {
      throw new OAuthError(
        OAuthErrorCode.SERVER_ERROR,
        'Failed to verify access token',
        500,
        { originalError: error }
      );
    }
  }

  static async getGoogleCerts(): Promise<jose.JSONWebKeySet> {
    const now = Date.now();

    if (this.certCache && this.certCache.expiry > now) {
      return this.certCache.jwks;
    }

    try {
      const response = await fetch(this.GOOGLE_CERTS_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch Google certificates');
      }

      const jwks = await response.json() as jose.JSONWebKeySet;
      
      // Cache for 1 hour
      this.certCache = {
        jwks,
        expiry: now + 3600000,
      };

      return jwks;
    } catch (error) {
      throw new OAuthError(
        OAuthErrorCode.SERVER_ERROR,
        'Failed to fetch Google certificates',
        500,
        { originalError: error }
      );
    }
  }

  private static validateTokenClaims(
    payload: IdTokenPayload,
    config: GoogleAuthConfig,
    nonce?: string
  ): void {
    if (nonce && payload.nonce !== nonce) {
      throw new OAuthError(
        OAuthErrorCode.INVALID_TOKEN,
        'Nonce mismatch',
        401
      );
    }

    if (config.hostedDomain && payload.hd !== config.hostedDomain) {
      throw new OAuthError(
        OAuthErrorCode.DOMAIN_NOT_ALLOWED,
        `Email domain must be ${config.hostedDomain}`,
        403
      );
    }

    if (!payload.email_verified) {
      throw new OAuthError(
        OAuthErrorCode.EMAIL_NOT_VERIFIED,
        'Email address not verified',
        403
      );
    }
  }

  private static handleTokenVerificationError(error: unknown): never {
    if (error instanceof OAuthError) {
      throw error;
    }

    if (error instanceof jose.errors.JWTExpired) {
      throw new OAuthError(
        OAuthErrorCode.TOKEN_EXPIRED,
        'ID token has expired',
        401
      );
    }

    throw new OAuthError(
      OAuthErrorCode.INVALID_TOKEN,
      'Failed to verify ID token',
      401,
      { originalError: error }
    );
  }

  private static validateIdTokenPayload(payload: jose.JWTPayload): IdTokenPayload {
    const schema = z.object({
      iss: z.string(),
      sub: z.string(),
      azp: z.string(),
      aud: z.string(),
      iat: z.number(),
      exp: z.number(),
      email: z.string().email(),
      email_verified: z.boolean(),
      name: z.string().optional(),
      picture: z.string().optional(),
      given_name: z.string().optional(),
      family_name: z.string().optional(),
      locale: z.string().optional(),
      hd: z.string().optional(),
      nonce: z.string().optional(),
    });

    try {
      return schema.parse(payload);
    } catch (error) {
      throw new OAuthError(
        OAuthErrorCode.INVALID_TOKEN,
        'Invalid ID token payload structure',
        401,
        { validationError: error }
      );
    }
  }


  static generateNonce(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  static isTokenExpired(exp?: number): boolean {
    if (!exp) return true;
    return Date.now() >= exp * 1000;
  }

  // Instance methods that delegate to static methods
  async validateAccessToken(accessToken: string): Promise<{ valid: boolean; payload?: { access_token: string; scope?: string; expires_in?: number; token_type: string }; error?: string }> {
    try {
      const result = await TokenValidator.verifyAccessToken(accessToken);
      if (result.active) {
        const payload: { access_token: string; scope?: string; expires_in?: number; token_type: string } = {
          access_token: accessToken,
          token_type: 'Bearer'
        };
        if (result.scope) payload.scope = result.scope;
        if (result.exp) payload.expires_in = result.exp - Math.floor(Date.now() / 1000);
        return { valid: true, payload };
      }
      return { valid: false, error: 'Invalid or expired access token' };
    } catch {
      return { valid: false, error: 'Invalid or expired access token' };
    }
  }

  async validateIdToken(idToken: string, nonce?: string): Promise<{ valid: boolean; payload?: IdTokenPayload; error?: string }> {
    try {
      const config: GoogleAuthConfig = {
        clientId: this.clientId,
        clientSecret: '', // Not needed for validation
        redirectUri: '', // Not needed for validation
        hostedDomain: this.hostedDomain,
      };
      const payload = await TokenValidator.verifyIdToken(idToken, config, nonce);
      return { valid: true, payload };
    } catch (error) {
      if (error instanceof OAuthError) {
        if (error.code === OAuthErrorCode.INVALID_TOKEN) {
          return { valid: false, error: 'Invalid ID token format' };
        } else if (error.code === OAuthErrorCode.TOKEN_EXPIRED) {
          return { valid: false, error: 'ID token has expired' };
        } else if (error.code === OAuthErrorCode.DOMAIN_NOT_ALLOWED) {
          return { valid: false, error: 'Domain not allowed' };
        }
        return { valid: false, error: error.message };
      }
      return { valid: false, error: 'Invalid ID token' };
    }
  }

  async getCertificates(): Promise<jose.JSONWebKeySet> {
    return TokenValidator.getGoogleCerts();
  }

  async verifyJWT(
    token: string,
    nonce?: string
  ): Promise<{ valid: boolean; payload?: IdTokenPayload; error?: string }> {
    return this.validateIdToken(token, nonce);
  }
  
  static async getCertificates(): Promise<Record<string, string>> {
    const now = Date.now();

    if (this.stringCertCache && this.stringCertCache.expiry > now) {
      return this.stringCertCache.certs;
    }

    try {
      const response = await fetch(this.GOOGLE_CERTS_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch Google certificates');
      }
      const result = await response.json() as Record<string, string>;
      
      // Cache the result for 1 hour
      this.stringCertCache = {
        certs: result,
        expiry: now + 3600000,
      };
      
      return result;
    } catch (error) {
      throw new Error(`Failed to fetch Google certificates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async verifyJWT(
    token: string,
    config: GoogleAuthConfig,
    nonce?: string
  ): Promise<IdTokenPayload> {
    return this.verifyIdToken(token, config, nonce);
  }
}