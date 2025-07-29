import type { QueryCommandOutput, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { QueryCommand as QueryCmd } from '@aws-sdk/lib-dynamodb';

import type { UserRole } from '../types/api';
import type { User } from '../types/user';

import type { MockDbClient } from './types';
import { mapDynamoItemToUser } from './user.repository.helpers';

export async function findActiveUsers(
  docClient: DynamoDBDocumentClient | MockDbClient,
  tableName: string,
  isMockClient: boolean
): Promise<User[]> {
  if (isMockClient) {
    const client = docClient as MockDbClient;
    const result = await client.query({ isActive: true });
    return result.items?.map((item) => item as unknown as User) ?? [];
  }

  const client = docClient as DynamoDBDocumentClient;
  const result: QueryCommandOutput = await client.send(
    new QueryCmd({
      TableName: tableName,
      IndexName: 'GSI4',
      KeyConditionExpression: 'GSI4PK = :pk',
      ExpressionAttributeValues: {
        ':pk': 'ACTIVE#true',
      },
    })
  );

  return result.Items?.map((item) => mapDynamoItemToUser(item) as User) ?? [];
}

export async function findInactiveUsers(
  docClient: DynamoDBDocumentClient | MockDbClient,
  tableName: string,
  isMockClient: boolean
): Promise<User[]> {
  if (isMockClient) {
    const client = docClient as MockDbClient;
    const result = await client.query({ isActive: false });
    return result.items?.map((item) => item as unknown as User) ?? [];
  }

  const client = docClient as DynamoDBDocumentClient;
  const result: QueryCommandOutput = await client.send(
    new QueryCmd({
      TableName: tableName,
      IndexName: 'GSI4',
      KeyConditionExpression: 'GSI4PK = :pk',
      ExpressionAttributeValues: {
        ':pk': 'ACTIVE#false',
      },
    })
  );

  return result.Items?.map((item) => mapDynamoItemToUser(item) as User) ?? [];
}

export async function countByRole(
  docClient: DynamoDBDocumentClient | MockDbClient,
  tableName: string,
  isMockClient: boolean,
  role: UserRole
): Promise<number> {
  if (isMockClient) {
    const client = docClient as MockDbClient;
    const result = await client.query({ role });
    return result.count ?? 0;
  }

  const client = docClient as DynamoDBDocumentClient;
  const queryParams = {
    TableName: tableName,
    IndexName: 'GSI2',
    KeyConditionExpression: 'GSI2PK = :pk',
    ExpressionAttributeValues: {
      ':pk': `ROLE#${role}`,
    },
    Select: 'COUNT' as const,
  };

  const result: QueryCommandOutput = await client.send(new QueryCmd(queryParams));
  return result.Count ?? 0;
}