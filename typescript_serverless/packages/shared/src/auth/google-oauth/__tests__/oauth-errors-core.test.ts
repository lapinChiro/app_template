import { describe, it, expect } from 'vitest';

import {
  GoogleOAuthError,
  InvalidGrantError,
  TokenExpiredError,
  InvalidClientError,
  UnauthorizedClientError,
  AccessDeniedError,
  UnsupportedResponseTypeError,
  ServerError,
  TemporarilyUnavailableError,
  InvalidRequestError,
  InvalidScopeError,
  NetworkError,
} from '../oauth-errors';

describe('OAuth Error Classes', () => {
  describe('GoogleOAuthError', () => {
    it('should create base error with message and code', () => {
      const error = new GoogleOAuthError('Test error', 'test_error');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(GoogleOAuthError);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('test_error');
      expect(error.name).toBe('GoogleOAuthError');
    });

    it('should include additional details if provided', () => {
      const details = { field: 'email', reason: 'invalid_format' };
      const error = new GoogleOAuthError('Invalid email', 'invalid_email', details);
      
      expect(error.details).toEqual(details);
    });

    it('should have proper stack trace', () => {
      const error = new GoogleOAuthError('Test error', 'test_error');
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('GoogleOAuthError');
    });
  });

  describe('Specific Error Classes', () => {
    it('InvalidGrantError should have correct properties', () => {
      const error = new InvalidGrantError('Authorization code expired');
      
      expect(error).toBeInstanceOf(InvalidGrantError);
      expect(error).toBeInstanceOf(GoogleOAuthError);
      expect(error.code).toBe('invalid_grant');
      expect(error.message).toBe('Authorization code expired');
    });

    it('TokenExpiredError should have correct properties', () => {
      const error = new TokenExpiredError();
      
      expect(error).toBeInstanceOf(TokenExpiredError);
      expect(error.code).toBe('token_expired');
      expect(error.message).toBe('The access token has expired');
    });

    it('InvalidClientError should have correct properties', () => {
      const error = new InvalidClientError();
      
      expect(error).toBeInstanceOf(InvalidClientError);
      expect(error.code).toBe('invalid_client');
      expect(error.message).toBe('Client authentication failed');
    });

    it('UnauthorizedClientError should have correct properties', () => {
      const error = new UnauthorizedClientError();
      
      expect(error).toBeInstanceOf(UnauthorizedClientError);
      expect(error.code).toBe('unauthorized_client');
      expect(error.message).toBe('The client is not authorized to use this authorization grant type');
    });

    it('AccessDeniedError should have correct properties', () => {
      const error = new AccessDeniedError();
      
      expect(error).toBeInstanceOf(AccessDeniedError);
      expect(error.code).toBe('access_denied');
      expect(error.message).toBe('The user denied the authorization request');
    });

    it('UnsupportedResponseTypeError should have correct properties', () => {
      const error = new UnsupportedResponseTypeError();
      
      expect(error).toBeInstanceOf(UnsupportedResponseTypeError);
      expect(error.code).toBe('unsupported_response_type');
    });

    it('ServerError should have correct properties', () => {
      const error = new ServerError();
      
      expect(error).toBeInstanceOf(ServerError);
      expect(error.code).toBe('server_error');
      expect(error.message).toBe('The authorization server encountered an unexpected condition');
    });

    it('TemporarilyUnavailableError should have correct properties', () => {
      const error = new TemporarilyUnavailableError();
      
      expect(error).toBeInstanceOf(TemporarilyUnavailableError);
      expect(error.code).toBe('temporarily_unavailable');
    });

    it('InvalidRequestError should have correct properties', () => {
      const error = new InvalidRequestError('Missing required parameter: code');
      
      expect(error).toBeInstanceOf(InvalidRequestError);
      expect(error.code).toBe('invalid_request');
      expect(error.message).toBe('Missing required parameter: code');
    });

    it('InvalidScopeError should have correct properties', () => {
      const error = new InvalidScopeError();
      
      expect(error).toBeInstanceOf(InvalidScopeError);
      expect(error.code).toBe('invalid_scope');
    });

    it('NetworkError should have correct properties', () => {
      const originalError = new Error('Connection timeout');
      const error = new NetworkError('Failed to connect to Google', originalError);
      
      expect(error).toBeInstanceOf(NetworkError);
      expect(error.code).toBe('network_error');
      expect(error.message).toBe('Failed to connect to Google');
      expect(error.details).toEqual({ originalError });
    });
  });

  describe('Error serialization', () => {
    it('should serialize error to JSON properly', () => {
      const error = new InvalidGrantError('Custom message');
      const serialized = JSON.stringify(error);
      const parsed = JSON.parse(serialized) as {name: string; message: string; code: string};

      expect(parsed.name).toBe('InvalidGrantError');
      expect(parsed.message).toBe('Custom message');
      expect(parsed.code).toBe('invalid_grant');
    });

    it('should include details in serialization', () => {
      const details = { field: 'scope', requested: ['admin'], allowed: ['user'] };
      const error = new InvalidScopeError('Requested scopes not allowed', details);
      const serialized = JSON.stringify(error);
      const parsed = JSON.parse(serialized) as {details?: typeof details};

      expect(parsed.details).toEqual(details);
    });
  });
});