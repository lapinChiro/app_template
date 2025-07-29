import type { QueryCommandOutput, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { QueryCommand as QueryCmd } from '@aws-sdk/lib-dynamodb';

import type { PaginationParams, PaginatedResponse } from '../types/common';
import type { User } from '../types/user';

import type { CursorPaginationParams, CursorPaginatedResponse } from './pagination.types';
import type { MockDbClient } from './types';
import { mapDynamoItemToUser } from './user.repository.helpers';

export async function listWithCursor(
  docClient: DynamoDBDocumentClient | MockDbClient,
  tableName: string,
  isMockClient: boolean,
  params?: CursorPaginationParams
): Promise<CursorPaginatedResponse<User>> {
  const limit = params?.limit ?? 20;
  const cursor = params?.cursor;

  if (isMockClient) {
    const client = docClient as MockDbClient;
    const result = await client.scan({ limit });
    const items = result.items?.map((item) => item as unknown as User) ?? [];
    return {
      items,
      total: result.count ?? items.length,
      limit,
    };
  }

  const client = docClient as DynamoDBDocumentClient;
  const startKey = cursor
    ? JSON.parse(Buffer.from(cursor, 'base64').toString()) as Record<string, unknown>
    : undefined;

  const result: QueryCommandOutput = await client.send(
    new QueryCmd({
      TableName: tableName,
      IndexName: 'GSI3',
      KeyConditionExpression: 'GSI3PK = :pk',
      ExpressionAttributeValues: {
        ':pk': 'USER',
      },
      Limit: limit,
      ExclusiveStartKey: startKey,
      ScanIndexForward: false, // Sort by creation date descending
    })
  );

  const items = result.Items?.map((item) => mapDynamoItemToUser(item) as User) ?? [];
  const total = result.Count ?? 0;
  const nextCursor = result.LastEvaluatedKey
    ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
    : undefined;

  return {
    items,
    total,
    limit,
    ...(nextCursor && { cursor: nextCursor }),
  };
}

export async function list(
  docClient: DynamoDBDocumentClient | MockDbClient,
  tableName: string,
  isMockClient: boolean,
  params?: PaginationParams
): Promise<PaginatedResponse<User>> {
  const limit = params?.limit ?? 20;
  const page = params?.page ?? 1;

  if (isMockClient) {
    const client = docClient as MockDbClient;
    const result = await client.scan({ limit });
    const items = result.items?.map((item) => item as unknown as User) ?? [];
    const total = result.count ?? items.length;
    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
  }

  // For DynamoDB, we'll use cursor-based pagination internally
  const cursorParams: CursorPaginationParams = {
    limit,
    ...(page > 1 && { cursor: Buffer.from(JSON.stringify({ page })).toString('base64') }),
  };

  const cursorResult = await listWithCursor(docClient, tableName, isMockClient, cursorParams);

  return {
    items: cursorResult.items,
    total: cursorResult.total,
    page,
    limit,
    pages: Math.ceil(cursorResult.total / limit),
    hasNext: !!cursorResult.cursor,
    hasPrev: page > 1,
  };
}