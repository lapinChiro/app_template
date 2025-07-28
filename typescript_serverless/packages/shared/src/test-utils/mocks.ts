import { vi } from 'vitest';

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
 * Create a mock repository with Vitest
 */
export function createMockRepository<T extends HasId>(): Repository<T> {
  return {
    findById: vi.fn(),
    findAll: vi.fn(),
    findPaginated: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    exists: vi.fn(),
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
    clone: vi.fn().mockReturnThis(),
    body: null,
    bodyUsed: false,
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    blob: vi.fn().mockResolvedValue(new Blob([JSON.stringify(data)])),
    formData: vi.fn().mockResolvedValue(new FormData()),
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
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
    getRemainingTimeInMillis: vi.fn().mockReturnValue(30000),
    done: vi.fn(),
    fail: vi.fn(),
    succeed: vi.fn(),
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
export function createMockDynamoDBClient(): Record<string, ReturnType<typeof vi.fn>> {
  return {
    get: vi.fn().mockReturnValue({ promise: vi.fn() }),
    put: vi.fn().mockReturnValue({ promise: vi.fn() }),
    update: vi.fn().mockReturnValue({ promise: vi.fn() }),
    delete: vi.fn().mockReturnValue({ promise: vi.fn() }),
    query: vi.fn().mockReturnValue({ promise: vi.fn() }),
    scan: vi.fn().mockReturnValue({ promise: vi.fn() }),
    batchGet: vi.fn().mockReturnValue({ promise: vi.fn() }),
    batchWrite: vi.fn().mockReturnValue({ promise: vi.fn() }),
  };
}

/**
 * Mock S3 client
 */
export function createMockS3Client(): Record<string, ReturnType<typeof vi.fn>> {
  return {
    getObject: vi.fn().mockReturnValue({ promise: vi.fn() }),
    putObject: vi.fn().mockReturnValue({ promise: vi.fn() }),
    deleteObject: vi.fn().mockReturnValue({ promise: vi.fn() }),
    listObjectsV2: vi.fn().mockReturnValue({ promise: vi.fn() }),
    headObject: vi.fn().mockReturnValue({ promise: vi.fn() }),
    getSignedUrl: vi.fn(),
    getSignedUrlPromise: vi.fn(),
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