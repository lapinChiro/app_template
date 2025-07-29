// Extended pagination params for cursor-based pagination
export interface CursorPaginationParams {
  limit?: number;
  cursor?: string | undefined;
}

// Extended paginated response for cursor-based pagination
export interface CursorPaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  cursor?: string | undefined;
}