import { describe, it, expect } from 'vitest';

import {
  parseOAuthError,
  isRetryableError,
  getErrorUserMessage,
  InvalidGrantError,
  InvalidClientError,
  TokenExpiredError,
  UnauthorizedClientError,
  AccessDeniedError,
  UnsupportedResponseTypeError as _UnsupportedResponseTypeError,
  ServerError,
  TemporarilyUnavailableError,
  InvalidRequestError as _InvalidRequestError,
  InvalidScopeError as _InvalidScopeError,
  NetworkError,
} from '../oauth-errors';

describe('OAuth Error Parsing and Utilities', () => {
  describe('parseOAuthError', () => {
    it('should parse invalid_grant error', () => {
      const errorResponse = { error: 'invalid_grant', error_description: 'Token expired' };
      const error = parseOAuthError(errorResponse);
      
      expect(error).toBeInstanceOf(InvalidGrantError);
      expect(error.message).toBe('Token expired');
      expect(error.code).toBe('invalid_grant');
    });

    it('should parse invalid_client error', () => {
      const errorResponse = { error: 'invalid_client', error_description: 'Client not found' };
      const error = parseOAuthError(errorResponse);
      
      expect(error).toBeInstanceOf(InvalidClientError);
      expect(error.message).toBe('Client not found');
      expect(error.code).toBe('invalid_client');
    });

    it('should parse unauthorized_client error', () => {
      const errorResponse = { error: 'unauthorized_client', error_description: 'Client unauthorized' };
      const error = parseOAuthError(errorResponse);
      
      expect(error).toBeInstanceOf(UnauthorizedClientError);
      expect(error.message).toBe('Client unauthorized');
      expect(error.code).toBe('unauthorized_client');
    });

    it('should parse access_denied error', () => {
      const errorResponse = { error: 'access_denied', error_description: 'User denied access' };
      const error = parseOAuthError(errorResponse);
      
      expect(error).toBeInstanceOf(AccessDeniedError);
      expect(error.message).toBe('User denied access');
      expect(error.code).toBe('access_denied');
    });

    it('should handle unknown error code', () => {
      const errorResponse = { error: 'unknown_error', error_description: 'Something went wrong' };
      const error = parseOAuthError(errorResponse);
      
      expect(error.message).toBe('Something went wrong');
      expect(error.code).toBe('unknown_error');
    });

    it('should handle error without description', () => {
      const errorResponse = { error: 'invalid_grant' };
      const error = parseOAuthError(errorResponse);
      
      expect(error).toBeInstanceOf(InvalidGrantError);
      expect(error.message).toBeTruthy();
      expect(error.code).toBe('invalid_grant');
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable errors', () => {
      const serverError = new ServerError('Server error');
      const tempUnavailable = new TemporarilyUnavailableError('Temporarily unavailable');
      const networkError = new NetworkError('Network error');
      
      expect(isRetryableError(serverError)).toBe(true);
      expect(isRetryableError(tempUnavailable)).toBe(true);
      expect(isRetryableError(networkError)).toBe(true);
    });

    it('should identify non-retryable errors', () => {
      const invalidGrant = new InvalidGrantError('Invalid grant');
      const invalidClient = new InvalidClientError('Invalid client');
      const tokenExpired = new TokenExpiredError('Token expired');
      
      expect(isRetryableError(invalidGrant)).toBe(false);
      expect(isRetryableError(invalidClient)).toBe(false);
      expect(isRetryableError(tokenExpired)).toBe(false);
    });
  });

  describe('getErrorUserMessage', () => {
    it('should provide user-friendly messages for auth errors', () => {
      const invalidGrant = new InvalidGrantError('Invalid grant');
      const tokenExpired = new TokenExpiredError('Token expired');
      const accessDenied = new AccessDeniedError('Access denied');
      
      expect(getErrorUserMessage(invalidGrant)).toContain('expired');
      expect(getErrorUserMessage(tokenExpired)).toContain('expired');
      expect(getErrorUserMessage(accessDenied)).toContain('denied');
    });

    it('should provide user-friendly messages for network errors', () => {
      const serverError = new ServerError('Server error');
      const networkError = new NetworkError('Network error');
      const tempUnavailable = new TemporarilyUnavailableError('Temporarily unavailable');
      
      expect(getErrorUserMessage(serverError)).toContain('try again later');
      expect(getErrorUserMessage(networkError)).toContain('internet connection');
      expect(getErrorUserMessage(tempUnavailable)).toContain('temporarily unavailable');
    });

    it('should provide user-friendly messages for client errors', () => {
      const invalidClient = new InvalidClientError('Invalid client');
      const unauthorizedClient = new UnauthorizedClientError('Unauthorized client');
      
      expect(getErrorUserMessage(invalidClient)).toContain('configuration issue');
      expect(getErrorUserMessage(unauthorizedClient)).toContain('configuration issue');
    });

    it('should provide generic message for unknown errors', () => {
      const unknownError = new Error('Unknown error');
      const message = getErrorUserMessage(unknownError);
      
      expect(message).toContain('unexpected error');
      expect(message).toContain('try again');
    });
  });
});