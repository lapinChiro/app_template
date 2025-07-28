import {
  createSuccessResponse,
  createErrorResponse,
  createCorsResponse,
  CORS_HEADERS,
} from './response.utils';

describe('Response Utils', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('CORS_HEADERS', () => {
    it('should use default origin when ALLOWED_ORIGIN is not set', () => {
      expect(CORS_HEADERS['Access-Control-Allow-Origin']).toBe('*');
    });

    it('should include all required CORS headers', () => {
      expect(CORS_HEADERS).toEqual({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      });
    });
  });

  describe('createSuccessResponse', () => {
    it('should create a success response with data', () => {
      const data = { message: 'Success', value: 42 };
      const result = createSuccessResponse(200, data);

      expect(result).toEqual({
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(data),
      });
    });

    it('should handle different status codes', () => {
      const data = { id: '123' };
      const result = createSuccessResponse(201, data);

      expect(result.statusCode).toBe(201);
      expect(JSON.parse(result.body)).toEqual(data);
    });
  });

  describe('createErrorResponse', () => {
    it('should create an error response without details', () => {
      const result = createErrorResponse(400, 'Bad Request', 'Invalid input');

      expect(result).toEqual({
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid input',
        }),
      });
    });

    it('should create an error response with details', () => {
      const details = { email: 'Invalid format', age: 'Must be positive' };
      const result = createErrorResponse(
        422,
        'Validation Error',
        'Input validation failed',
        details
      );

      expect(result.statusCode).toBe(422);
      const body = JSON.parse(result.body);
      expect(body).toEqual({
        error: 'Validation Error',
        message: 'Input validation failed',
        details,
      });
    });
  });

  describe('createCorsResponse', () => {
    it('should create a CORS preflight response', () => {
      const result = createCorsResponse();

      expect(result).toEqual({
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({}),
      });
    });
  });
});