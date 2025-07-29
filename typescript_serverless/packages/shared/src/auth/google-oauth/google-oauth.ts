import * as crypto from 'crypto';

import { z } from 'zod';

import { OAuthError, OAuthErrorCode } from './oauth-errors';
import { TokenValidator } from './token-validator';
import type {
  GoogleAuthConfig,
  GoogleTokenResponse,
  GoogleUserInfo,
  PKCEParameters,
  IdTokenPayload
} from './types';

export class GoogleOAuth {
  private readonly config: GoogleAuthConfig;
  private readonly authorizationEndpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
  private readonly tokenEndpoint = 'https://oauth2.googleapis.com/token';
  private readonly userInfoEndpoint = 'https://www.googleapis.com/oauth2/v2/userinfo';
  private readonly revokeEndpoint = 'https://oauth2.googleapis.com/revoke';

  constructor(config: GoogleAuthConfig) {
    this.config = config;
  }

  generateAuthorizationUrl(params: {
    scopes?: string[];
    state?: string;
    loginHint?: string;
    prompt?: 'none' | 'consent' | 'select_account';
    pkceParameters?: PKCEParameters;
    nonce?: string;
  } = {}): string {
    const url = new URL(this.authorizationEndpoint);
    const searchParams = url.searchParams;

    // Set required parameters
    this.setRequiredAuthParams(searchParams, params);
    
    // Set optional parameters
    this.setOptionalAuthParams(searchParams, params);

    return url.toString();
  }

  async exchangeCodeForTokens(
    code: string,
    codeVerifier?: string
  ): Promise<GoogleTokenResponse> {
    const params = new URLSearchParams({
      code,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: this.config.redirectUri,
      grant_type: 'authorization_code',
    });

    if (codeVerifier) {
      params.set('code_verifier', codeVerifier);
    }

    try {
      const data = await this.performTokenRequest(this.tokenEndpoint, params);
      return this.validateTokenResponse(data);
    } catch (error) {
      if (error instanceof OAuthError) {
        throw error;
      }
      throw new OAuthError(
        OAuthErrorCode.INVALID_GRANT,
        'Failed to exchange authorization code',
        400,
        { originalError: error }
      );
    }
  }

  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    try {
      const response = await fetch(this.userInfoEndpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new OAuthError(
            OAuthErrorCode.INVALID_TOKEN,
            'Access token is invalid or expired',
            401
          );
        }
        throw new Error(`Failed to fetch user info: ${response.statusText}`);
      }

      const data = await response.json();
      return this.validateUserInfo(data);
    } catch (error) {
      if (error instanceof OAuthError) {
        throw error;
      }
      throw new OAuthError(
        OAuthErrorCode.SERVER_ERROR,
        'Failed to fetch user information',
        500,
        { originalError: error }
      );
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
    const params = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: 'refresh_token',
    });

    try {
      const data = await this.performTokenRequest(this.tokenEndpoint, params);
      return this.validateTokenResponse(data);
    } catch (error) {
      if (error instanceof OAuthError) {
        throw error;
      }
      throw new OAuthError(
        OAuthErrorCode.INVALID_GRANT,
        'Failed to refresh access token',
        400,
        { originalError: error }
      );
    }
  }

  async revokeToken(token: string): Promise<void> {
    try {
      const params = new URLSearchParams({
        token,
      });

      const response = await fetch(this.revokeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok && response.status !== 400) {
        throw new Error(`Failed to revoke token: ${response.statusText}`);
      }
    } catch (error) {
      throw new OAuthError(
        OAuthErrorCode.SERVER_ERROR,
        'Failed to revoke token',
        500,
        { originalError: error }
      );
    }
  }

  async verifyIdToken(idToken: string, nonce?: string): Promise<IdTokenPayload> {
    return TokenValidator.verifyIdToken(idToken, this.config, nonce);
  }

  generatePKCEParameters(): PKCEParameters {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);
    const state = this.generateState();

    return {
      codeVerifier,
      codeChallenge,
      state,
    };
  }

  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64UrlEncode(array);
  }

  private generateCodeChallenge(verifier: string): string {
    const hash = crypto.createHash('sha256').update(verifier).digest();
    return this.base64UrlEncode(hash);
  }

  private generateState(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return this.base64UrlEncode(array);
  }

  private base64UrlEncode(buffer: Uint8Array): string {
    return Buffer.from(buffer)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private setRequiredAuthParams(
    searchParams: URLSearchParams,
    params: { scopes?: string[] }
  ): void {
    searchParams.set('client_id', this.config.clientId);
    searchParams.set('redirect_uri', this.config.redirectUri);
    searchParams.set('response_type', 'code');
    searchParams.set('scope', (params.scopes ?? ['openid', 'email', 'profile']).join(' '));
    searchParams.set('access_type', 'offline');
    searchParams.set('include_granted_scopes', 'true');
  }

  private setOptionalAuthParams(
    searchParams: URLSearchParams,
    params: {
      state?: string;
      loginHint?: string;
      prompt?: 'none' | 'consent' | 'select_account';
      pkceParameters?: PKCEParameters;
      nonce?: string;
    }
  ): void {
    if (params.state) {
      searchParams.set('state', params.state);
    }

    if (params.loginHint) {
      searchParams.set('login_hint', params.loginHint);
    }

    if (params.prompt) {
      searchParams.set('prompt', params.prompt);
    }

    if (this.config.hostedDomain) {
      searchParams.set('hd', this.config.hostedDomain);
    }

    if (params.pkceParameters) {
      searchParams.set('code_challenge', params.pkceParameters.codeChallenge);
      searchParams.set('code_challenge_method', 'S256');
    }

    if (params.nonce) {
      searchParams.set('nonce', params.nonce);
    }
  }

  private async performTokenRequest(
    endpoint: string,
    params: URLSearchParams
  ): Promise<unknown> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw OAuthError.parseError(data);
    }

    return data;
  }

  private validateTokenResponse(data: unknown): GoogleTokenResponse {
    const schema = z.object({
      access_token: z.string(),
      token_type: z.string(),
      expires_in: z.number(),
      refresh_token: z.string().optional(),
      scope: z.string(),
      id_token: z.string().optional(),
    });

    try {
      return schema.parse(data);
    } catch (error) {
      throw new OAuthError(
        OAuthErrorCode.INVALID_GRANT,
        'Invalid token response from Google',
        400,
        { validationError: error }
      );
    }
  }

  private validateUserInfo(data: unknown): GoogleUserInfo {
    const schema = z.object({
      id: z.string(),
      email: z.string().email(),
      verified_email: z.boolean(),
      name: z.string(),
      given_name: z.string().optional(),
      family_name: z.string().optional(),
      picture: z.string().url().optional(),
      locale: z.string().optional(),
      hd: z.string().optional(),
    });

    try {
      return schema.parse(data);
    } catch (error) {
      throw new OAuthError(
        OAuthErrorCode.SERVER_ERROR,
        'Invalid user info response from Google',
        500,
        { validationError: error }
      );
    }
  }
}