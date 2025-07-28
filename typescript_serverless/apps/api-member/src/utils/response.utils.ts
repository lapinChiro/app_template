import { APIGatewayProxyResult } from 'aws-lambda';
import { ErrorResponse } from '../types/auth.types';

export const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': process.env['ALLOWED_ORIGIN'] || '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
} as const;

export function createSuccessResponse<T>(
  statusCode: number,
  data: T
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(data),
  };
}

export function createErrorResponse(
  statusCode: number,
  error: string,
  message: string,
  details?: Record<string, string>
): APIGatewayProxyResult {
  const errorBody: ErrorResponse = {
    error,
    message,
    ...(details && { details }),
  };

  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(errorBody),
  };
}

export function createCorsResponse(): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({}),
  };
}