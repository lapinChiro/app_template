// Database client interface for mocking
export interface MockDbClient {
  query: (params: Record<string, unknown>) => Promise<{
    items?: Array<Record<string, unknown>>;
    count?: number;
    lastKey?: Record<string, unknown>;
  }>;
  get: (id: string) => Promise<Record<string, unknown> | null>;
  put: (item: Record<string, unknown>) => Promise<Record<string, unknown>>;
  update: (id: string, updates: Record<string, unknown>) => Promise<Record<string, unknown>>;
  delete: (id: string) => Promise<boolean>;
  batchGet: (ids: string[]) => Promise<Array<Record<string, unknown>>>;
  scan: (params: Record<string, unknown>) => Promise<{
    items?: Array<Record<string, unknown>>;
    count?: number;
    lastKey?: Record<string, unknown>;
  }>;
}