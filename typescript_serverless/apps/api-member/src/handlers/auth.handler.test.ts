import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { handler, createAuthService } from './auth.handler';
import { AuthService } from '../services/auth.service';
import { UnauthorizedError } from '../errors/auth.errors';

// Mock the auth handler module partially
jest.mock('./auth.handler', () => ({
  ...jest.requireActual('./auth.handler'),
  createAuthService: jest.fn(),
}));

describe('Auth Lambda Handler', () => {
  let mockEvent: APIGatewayProxyEvent;
  let mockContext: Context;
  let mockAuthService: jest.Mocked<AuthService>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock AuthService
    mockAuthService = {
      login: jest.fn(),
    } as jest.Mocked<AuthService>;
    
    (createAuthService as jest.Mock).mockReturnValue(mockAuthService);

    mockEvent = {
      body: null,
      headers: {},
      multiValueHeaders: {},
      httpMethod: 'POST',
      isBase64Encoded: false,
      path: '/auth/login',
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {
        accountId: '123456789012',
        apiId: 'api-id',
        authorizer: null,
        protocol: 'HTTP/1.1',
        httpMethod: 'POST',
        path: '/auth/login',
        stage: 'dev',
        requestId: 'request-id',
        requestTime: '01/Jan/2025:00:00:00 +0000',
        requestTimeEpoch: 1640995200000,
        identity: {
          cognitoIdentityPoolId: null,
          accountId: null,
          cognitoIdentityId: null,
          caller: null,
          apiKey: null,
          sourceIp: '127.0.0.1',
          cognitoAuthenticationType: null,
          cognitoAuthenticationProvider: null,
          userArn: null,
          userAgent: 'Test-Agent',
          user: null,
          accessKey: null,
          apiKeyId: null,
          clientCert: null,
          principalOrgId: null
        },
        resourceId: 'resource-id',
        resourcePath: '/auth/login',
        domainName: 'api.example.com',
        domainPrefix: 'api'
      },
      resource: '/auth/login'
    };

    mockContext = {
      callbackWaitsForEmptyEventLoop: true,
      functionName: 'auth-handler',
      functionVersion: '1',
      invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:auth-handler',
      memoryLimitInMB: '128',
      awsRequestId: 'request-id',
      logGroupName: '/aws/lambda/auth-handler',
      logStreamName: '2025/01/01/[$LATEST]abcdef123456',
      getRemainingTimeInMillis: () => 30000,
      done: jest.fn(),
      fail: jest.fn(),
      succeed: jest.fn()
    };
  });

  describe('POST /auth/login', () => {
    it('should return 400 when body is missing', async () => {
      const result = await handler(mockEvent, mockContext) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: 'Bad Request',
        message: 'Request body is required'
      });
    });

    it('should return 400 when email is missing', async () => {
      mockEvent.body = JSON.stringify({ password: 'test123' });

      const result = await handler(mockEvent, mockContext) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Validation failed');
      expect(body.details).toHaveProperty('email');
    });

    it('should return 400 when password is missing', async () => {
      mockEvent.body = JSON.stringify({ email: 'test@example.com' });

      const result = await handler(mockEvent, mockContext) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Validation failed');
      expect(body.details).toHaveProperty('password');
    });

    it('should return 401 when credentials are invalid', async () => {
      mockAuthService.login.mockRejectedValue(new UnauthorizedError());
      
      mockEvent.body = JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

      const result = await handler(mockEvent, mockContext) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body)).toEqual({
        error: 'Unauthorized',
        message: 'Invalid credentials'
      });
    });

    it('should return 200 with token when credentials are valid', async () => {
      const mockLoginResponse = {
        token: 'mock-jwt-token-123456',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User'
        }
      };
      
      mockAuthService.login.mockResolvedValue(mockLoginResponse);
      
      mockEvent.body = JSON.stringify({
        email: 'test@example.com',
        password: 'correctpassword'
      });

      const result = await handler(mockEvent, mockContext) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('token');
      expect(body.token).toMatch(/^mock-jwt-token-\d+$/);
      expect(body).toHaveProperty('user');
      expect(body.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User'
      });
    });

    it('should include CORS headers in response', async () => {
      const result = await handler(mockEvent, mockContext) as APIGatewayProxyResult;

      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      });
    });

    it('should return 400 for invalid email format', async () => {
      mockEvent.body = JSON.stringify({
        email: 'invalid-email',
        password: 'password123'
      });

      const result = await handler(mockEvent, mockContext) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Validation failed');
      expect(body.details.email).toContain('Invalid email');
    });

    it('should return 400 for invalid JSON in body', async () => {
      mockEvent.body = 'invalid json';

      const result = await handler(mockEvent, mockContext) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: 'Bad Request',
        message: 'Invalid JSON in request body'
      });
    });
  });

  describe('OPTIONS request', () => {
    it('should return 200 with CORS headers for preflight', async () => {
      mockEvent.httpMethod = 'OPTIONS';

      const result = await handler(mockEvent, mockContext) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      });
    });
  });

  describe('Unsupported methods', () => {
    it('should return 405 for GET request', async () => {
      mockEvent.httpMethod = 'GET';

      const result = await handler(mockEvent, mockContext) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(405);
      expect(JSON.parse(result.body)).toEqual({
        error: 'Method Not Allowed',
        message: 'GET method is not supported'
      });
    });
  });

  describe('Error handling', () => {
    it('should return 401 for invalid login attempt', async () => {
      mockEvent.body = JSON.stringify({
        email: 'wrong@example.com',
        password: 'wrongpassword'
      });

      const result = await handler(mockEvent, mockContext) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body)).toEqual({
        error: 'Unauthorized',
        message: 'Invalid credentials'
      });
    });
  });
});