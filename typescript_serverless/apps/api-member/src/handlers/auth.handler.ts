import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ZodError } from 'zod';
import { LoginRequestSchema } from '../types/auth.types';
import { AuthService } from '../services/auth.service';
import { AuthError, MethodNotAllowedError, ValidationError } from '../errors/auth.errors';
import {
  createSuccessResponse,
  createErrorResponse,
  createCorsResponse,
} from '../utils/response.utils';

// Export for testing
export const createAuthService = () => new AuthService();

export const handler = async (
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return createCorsResponse();
    }

    // Only allow POST method
    if (event.httpMethod !== 'POST') {
      throw new MethodNotAllowedError(event.httpMethod);
    }

    // Check if body exists
    if (!event.body) {
      throw new ValidationError('Request body is required');
    }

    // Parse and validate request body
    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(event.body);
    } catch (error) {
      throw new ValidationError('Invalid JSON in request body');
    }

    // Validate request schema
    const loginRequest = LoginRequestSchema.parse(parsedBody);

    // Perform authentication
    const authService = createAuthService();
    const loginResponse = await authService.login(loginRequest);

    return createSuccessResponse(200, loginResponse);
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const details: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        details[path] = err.message;
      });
      return createErrorResponse(
        400,
        'Bad Request',
        'Validation failed',
        details
      );
    }

    // Handle custom auth errors
    if (error instanceof AuthError) {
      return createErrorResponse(
        error.statusCode,
        error.errorType,
        error.message,
        error.details
      );
    }

    // Handle unexpected errors
    console.error('Unexpected error:', error);
    return createErrorResponse(
      500,
      'Internal Server Error',
      'An unexpected error occurred'
    );
  }
};