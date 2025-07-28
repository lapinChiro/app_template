import { APIGatewayProxyResult } from 'aws-lambda';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

export const createResponse = (
  statusCode: number,
  body: any
): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: corsHeaders,
    body: typeof body === 'string' ? body : JSON.stringify(body)
  };
};

export const successResponse = (data: any): APIGatewayProxyResult => {
  return createResponse(200, data);
};

export const createdResponse = (data: any): APIGatewayProxyResult => {
  return createResponse(201, data);
};

export const noContentResponse = (): APIGatewayProxyResult => {
  return createResponse(204, '');
};

export const badRequestResponse = (message: string): APIGatewayProxyResult => {
  return createResponse(400, {
    error: 'Bad Request',
    message
  });
};

export const unauthorizedResponse = (message: string): APIGatewayProxyResult => {
  return createResponse(401, {
    error: 'Unauthorized',
    message
  });
};

export const notFoundResponse = (message: string): APIGatewayProxyResult => {
  return createResponse(404, {
    error: 'Not Found',
    message
  });
};

export const methodNotAllowedResponse = (method: string): APIGatewayProxyResult => {
  return createResponse(405, {
    error: 'Method Not Allowed',
    message: `${method} method is not supported`
  });
};

export const serverErrorResponse = (message: string = 'Internal server error'): APIGatewayProxyResult => {
  return createResponse(500, {
    error: 'Internal Server Error',
    message
  });
};