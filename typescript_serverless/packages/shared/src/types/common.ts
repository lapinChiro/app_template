// Utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// Extract keys that have string values
export type StringKeys<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];

// Make specific keys optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Make specific keys required
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// Branded types for type safety
export type Brand<T, B> = T & { __brand: B };

export type UUID = Brand<string, 'UUID'>;
export type Email = Brand<string, 'Email'>;
export type URL = Brand<string, 'URL'>;
export type ISO8601 = Brand<string, 'ISO8601'>;

// Common domain types
export type ID = string;
export type Timestamp = string; // ISO 8601

export interface HasId {
  id: ID;
}

export interface HasTimestamps {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface HasSoftDelete {
  deletedAt?: Timestamp;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Result types for error handling
export type Result<T, E = Error> = Success<T> | Failure<E>;

export interface Success<T> {
  success: true;
  data: T;
}

export interface Failure<E = Error> {
  success: false;
  error: E;
}

// Async types
export type AsyncFunction<T = void> = () => Promise<T>;
export type AsyncPredicate<T> = (value: T) => Promise<boolean>;

// JSON types
export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

// Environment types
export type Environment = 'development' | 'staging' | 'production' | 'test';

// HTTP method types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

// Status types
export type Status = 'active' | 'inactive' | 'pending' | 'archived';