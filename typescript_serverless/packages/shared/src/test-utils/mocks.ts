import type { AuthUser, JwtPayload } from '../types/api';
import type { HasId, PaginatedResponse, PaginationParams } from '../types/common';

/**
 * Generic repository interface for testing
 */
export interface Repository<T extends HasId> {
  findById(id: string): Promise<T | null>;
  findAll(params?: PaginationParams): Promise<T[]>;
  findPaginated(params: PaginationParams): Promise<PaginatedResponse<T>>;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}

/**
 * Create a mock repository with Jest
 */
export function createMockRepository<T extends HasId>(): jest.Mocked<Repository<T>> {
  return {
    findById: jest.fn(),
    findAll: jest.fn(),
    findPaginated: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    exists: jest.fn(),
  };
}

/**
 * Mock HTTP Response object
 */
export function mockApiResponse<T>(data: T, status = 200): Response {
  return {
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    ok: status >= 200 && status < 300,
    headers: new Headers({
      'content-type': 'application/json',
    }),
    redirected: false,
    type: 'basic',
    url: '',
    clone: jest.fn().mockReturnThis(),
    body: null,
    bodyUsed: false,
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
    blob: jest.fn().mockResolvedValue(new Blob([JSON.stringify(data)])),
    formData: jest.fn().mockResolvedValue(new FormData()),
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
  } as unknown as Response;
}

/**
 * Mock authenticated user for testing
 */
export function mockAuthUser(overrides?: Partial<AuthUser>): AuthUser {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'member',
    permissions: [],
    ...overrides,
  };
}

/**
 * Mock JWT payload for testing
 */
export function mockJwtPayload(overrides?: Partial<JwtPayload>): JwtPayload {
  const now = Math.floor(Date.now() / 1000);
  return {
    sub: 'test-user-id',
    email: 'test@example.com',
    role: 'member',
    iat: now,
    exp: now + 3600, // 1 hour
    ...overrides,
  };
}

/**
 * AWS Lambda Context interface
 */
export interface LambdaContext {
  callbackWaitsForEmptyEventLoop: boolean;
  functionName: string;
  functionVersion: string;
  invokedFunctionArn: string;
  memoryLimitInMB: string;
  awsRequestId: string;
  logGroupName: string;
  logStreamName: string;
  getRemainingTimeInMillis: () => number;
  done: (error?: Error, result?: unknown) => void;
  fail: (error: Error) => void;
  succeed: (messageOrObject: unknown) => void;
}

/**
 * Mock AWS Lambda context for testing
 */
export function mockLambdaContext(overrides?: Partial<LambdaContext>): LambdaContext {
  return {
    callbackWaitsForEmptyEventLoop: true,
    functionName: 'test-function',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:ap-northeast-1:123456789012:function:test-function',
    memoryLimitInMB: '512',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/test-function',
    logStreamName: '2024/01/01/[$LATEST]test-stream',
    getRemainingTimeInMillis: jest.fn().mockReturnValue(30000),
    done: jest.fn(),
    fail: jest.fn(),
    succeed: jest.fn(),
    ...overrides,
  };
}

/**
 * Mock API Gateway event
 */
export interface ApiGatewayEvent {
  body: string | null;
  headers: Record<string, string>;
  httpMethod: string;
  path: string;
  pathParameters: Record<string, string> | null;
  queryStringParameters: Record<string, string> | null;
  requestContext: {
    accountId: string;
    apiId: string;
    authorizer?: {
      claims?: Record<string, unknown>;
      principalId?: string;
    };
    requestId: string;
    stage: string;
  };
}

/**
 * Mock API Gateway event for testing
 */
export function mockApiGatewayEvent(overrides?: Partial<ApiGatewayEvent>): ApiGatewayEvent {
  return {
    body: null,
    headers: {
      'content-type': 'application/json',
      'user-agent': 'jest-test',
    },
    httpMethod: 'GET',
    path: '/test',
    pathParameters: null,
    queryStringParameters: null,
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api-id',
      requestId: 'test-request-id',
      stage: 'test',
      ...overrides?.requestContext,
    },
    ...overrides,
  };
}

/**
 * Mock DynamoDB client
 */
export function createMockDynamoDBClient(): Record<string, jest.Mock> {
  return {
    get: jest.fn().mockReturnValue({ promise: jest.fn() }),
    put: jest.fn().mockReturnValue({ promise: jest.fn() }),
    update: jest.fn().mockReturnValue({ promise: jest.fn() }),
    delete: jest.fn().mockReturnValue({ promise: jest.fn() }),
    query: jest.fn().mockReturnValue({ promise: jest.fn() }),
    scan: jest.fn().mockReturnValue({ promise: jest.fn() }),
    batchGet: jest.fn().mockReturnValue({ promise: jest.fn() }),
    batchWrite: jest.fn().mockReturnValue({ promise: jest.fn() }),
  };
}

/**
 * Mock S3 client
 */
export function createMockS3Client(): Record<string, jest.Mock> {
  return {
    getObject: jest.fn().mockReturnValue({ promise: jest.fn() }),
    putObject: jest.fn().mockReturnValue({ promise: jest.fn() }),
    deleteObject: jest.fn().mockReturnValue({ promise: jest.fn() }),
    listObjectsV2: jest.fn().mockReturnValue({ promise: jest.fn() }),
    headObject: jest.fn().mockReturnValue({ promise: jest.fn() }),
    getSignedUrl: jest.fn(),
    getSignedUrlPromise: jest.fn(),
  };
}

/**
 * Mock Next.js request and response
 */
export function mockNextRequest(overrides?: Partial<Request>): Request {
  return {
    method: 'GET',
    url: 'http://localhost:3000/test',
    headers: new Headers({
      'content-type': 'application/json',
    }),
    ...overrides,
  } as Request;
}

export function mockNextResponse<T = unknown>(data?: T, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'content-type': 'application/json',
    },
    ...init,
  });
}