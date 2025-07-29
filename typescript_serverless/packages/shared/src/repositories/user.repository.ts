import type { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
  ScanCommand,
  type GetCommandOutput,
  type QueryCommandOutput,
  type ScanCommandOutput,
  type UpdateCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

import type { UserRole } from '../types/api';
import type { PaginationParams, PaginatedResponse } from '../types/common';
import type { User, CreateUserInput, UpdateUserInput } from '../types/user';

import type { CursorPaginationParams, CursorPaginatedResponse } from './pagination.types';
import type { MockDbClient } from './types';
import {
  buildUpdateExpression,
  buildExpressionAttributeNames,
  buildExpressionAttributeValues,
  mapDynamoItemToUser,
} from './user.repository.helpers';
import { list as listHelper, listWithCursor as listWithCursorHelper } from './user.repository.pagination';
import { findActiveUsers, findInactiveUsers, countByRole } from './user.repository.queries';

export class UserRepository {
  private readonly docClient: DynamoDBDocumentClient | MockDbClient;
  private readonly tableName: string;
  private readonly isMockClient: boolean;

  constructor(dbClient?: DynamoDBClient | MockDbClient) {
    if (!dbClient || 'query' in dbClient) {
      this.isMockClient = true;
      this.docClient = dbClient as MockDbClient;
      this.tableName = 'test-table';
    } else {
      this.isMockClient = false;
      this.docClient = DynamoDBDocumentClient.from(dbClient, {
        marshallOptions: {
          removeUndefinedValues: true,
        },
      });
      this.tableName = process.env['DYNAMODB_TABLE_NAME'] ?? 'serverless-template';
    }
  }

  async create(input: CreateUserInput): Promise<User> {
    // Check if email already exists
    const existing = await this.findByEmail(input.email);
    if (existing) {
      throw new Error('User with this email already exists');
    }

    const now = new Date().toISOString();
    const user: User = {
      id: uuidv4(),
      email: input.email,
      name: input.name,
      role: input.role ?? 'member',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      ...(input.googleId && { googleId: input.googleId }),
    };

    if (this.isMockClient) {
      const client = this.docClient as MockDbClient;
      const userRecord: Record<string, unknown> = { ...user };
      return (await client.put(userRecord)) as unknown as User;
    }

    const item = {
      PK: `USER#${user.id}`,
      SK: `USER#${user.id}`,
      GSI1PK: `EMAIL#${user.email}`,
      GSI1SK: `EMAIL#${user.email}`,
      GSI2PK: `ROLE#${user.role}`,
      GSI2SK: `USER#${user.id}`,
      GSI3PK: 'USER',
      GSI3SK: `CREATED#${user.createdAt}`,
      GSI4PK: `ACTIVE#${user.isActive}`,
      GSI4SK: `USER#${user.id}`,
      ...user,
    };

    const client = this.docClient as DynamoDBDocumentClient;
    await client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item,
        ConditionExpression: 'attribute_not_exists(PK)',
      })
    );

    return user;
  }

  async findById(id: string): Promise<User | null> {
    // For mock client
    if (this.isMockClient) {
      const client = this.docClient as MockDbClient;
      const result = await client.get(id);
      if (!result?.['isActive']) {
        return null;
      }
      return result as unknown as User;
    }

    // For real DynamoDB
    const client = this.docClient as DynamoDBDocumentClient;
    const result: GetCommandOutput = await client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `USER#${id}`,
          SK: `USER#${id}`,
        },
      })
    );

    if (!result.Item?.['isActive']) {
      return null;
    }

    return mapDynamoItemToUser(result.Item) as User;
  }

  async findByEmail(email: string): Promise<User | null> {
    if (this.isMockClient) {
      const client = this.docClient as MockDbClient;
      const result = await client.query({ email });
      return result.items?.[0] ? (result.items[0] as unknown as User) : null;
    }

    const client = this.docClient as DynamoDBDocumentClient;
    const result: QueryCommandOutput = await client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
        ExpressionAttributeValues: {
          ':pk': `EMAIL#${email}`,
          ':sk': `EMAIL#${email}`,
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    return mapDynamoItemToUser(result.Items[0] as Record<string, unknown>) as User;
  }

  async findByRole(role: UserRole): Promise<User[]> {
    if (this.isMockClient) {
      const client = this.docClient as MockDbClient;
      const result = await client.query({ role });
      return result.items?.map((item) => item as unknown as User) ?? [];
    }

    const client = this.docClient as DynamoDBDocumentClient;
    const result: QueryCommandOutput = await client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `ROLE#${role}`,
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return [];
    }

    return result.Items.map((item) => mapDynamoItemToUser(item) as User);
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    if (this.isMockClient) {
      const client = this.docClient as MockDbClient;
      const result = await client.query({ googleId });
      return result.items?.[0] ? (result.items[0] as unknown as User) : null;
    }

    const client = this.docClient as DynamoDBDocumentClient;
    const result: ScanCommandOutput = await client.send(
      new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'googleId = :googleId AND isActive = :active',
        ExpressionAttributeValues: {
          ':googleId': googleId,
          ':active': true,
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    return mapDynamoItemToUser(result.Items[0] as Record<string, unknown>) as User;
  }

  async update(id: string, input: UpdateUserInput): Promise<User | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const updates: Record<string, unknown> = {
      ...input,
      updatedAt: new Date().toISOString(),
    };

    if (this.isMockClient) {
      const client = this.docClient as MockDbClient;
      return (await client.update(id, updates)) as unknown as User;
    }

    const client = this.docClient as DynamoDBDocumentClient;
    const result: UpdateCommandOutput = await client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: `USER#${id}`,
          SK: `USER#${id}`,
        },
        UpdateExpression: buildUpdateExpression(updates),
        ExpressionAttributeNames: buildExpressionAttributeNames(updates),
        ExpressionAttributeValues: buildExpressionAttributeValues(updates),
        ReturnValues: 'ALL_NEW',
      })
    );

    if (!result.Attributes) {
      return null;
    }

    return mapDynamoItemToUser(result.Attributes) as User;
  }

  async updateLastLogin(id: string): Promise<User | null> {
    const updateData = {
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return this.update(id, updateData as UpdateUserInput);
  }

  async delete(id: string): Promise<boolean> {
    // Check if user exists first
    const existing = await this.findById(id);
    if (!existing) {
      return false;
    }

    if (this.isMockClient) {
      const client = this.docClient as MockDbClient;
      await client.update(id, {
        isActive: false,
        deletedAt: new Date().toISOString(),
      });
      return true;
    }

    const client = this.docClient as DynamoDBDocumentClient;
    await client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: `USER#${id}`,
          SK: `USER#${id}`,
        },
        UpdateExpression: 'SET isActive = :active, deletedAt = :deletedAt, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':active': false,
          ':deletedAt': new Date().toISOString(),
          ':updatedAt': new Date().toISOString(),
        },
      })
    );

    return true;
  }

  async list(params?: PaginationParams): Promise<PaginatedResponse<User>> {
    return listHelper(this.docClient, this.tableName, this.isMockClient, params);
  }

  async listWithCursor(params?: CursorPaginationParams): Promise<CursorPaginatedResponse<User>> {
    return listWithCursorHelper(this.docClient, this.tableName, this.isMockClient, params);
  }

  async findActiveUsers(): Promise<User[]> {
    return findActiveUsers(this.docClient, this.tableName, this.isMockClient);
  }

  async findInactiveUsers(): Promise<User[]> {
    return findInactiveUsers(this.docClient, this.tableName, this.isMockClient);
  }

  async countByRole(role: UserRole): Promise<number> {
    return countByRole(this.docClient, this.tableName, this.isMockClient, role);
  }
}