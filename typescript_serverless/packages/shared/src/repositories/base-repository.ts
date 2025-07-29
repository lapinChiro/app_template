import type { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

import type { MockDbClient } from './types';

/**
 * Base repository class that handles client abstraction
 * Follows the Strategy pattern for different database implementations
 */
export abstract class BaseRepository {
  protected readonly client: DynamoDBDocumentClient | MockDbClient;
  protected readonly tableName: string;
  protected readonly isMockClient: boolean;

  constructor(dbClient?: DynamoDBClient | MockDbClient) {
    if (!dbClient || 'query' in dbClient) {
      this.isMockClient = true;
      this.client = dbClient as MockDbClient;
      this.tableName = 'test-table';
    } else {
      this.isMockClient = false;
      this.client = DynamoDBDocumentClient.from(dbClient, {
        marshallOptions: {
          removeUndefinedValues: true,
        },
      });
      this.tableName = process.env['DYNAMODB_TABLE_NAME'] ?? 'serverless-template';
    }
  }

  /**
   * Template method for client-specific operations
   */
  protected async executeOperation<T>(
    mockOperation: () => Promise<T>,
    dynamoOperation: () => Promise<T>
  ): Promise<T> {
    return this.isMockClient ? mockOperation() : dynamoOperation();
  }

  /**
   * Get typed client for specific database operations
   */
  protected getMockClient(): MockDbClient {
    if (!this.isMockClient) {
      throw new Error('Not a mock client');
    }
    return this.client as MockDbClient;
  }

  /**
   * Get typed client for DynamoDB operations
   */
  protected getDynamoClient(): DynamoDBDocumentClient {
    if (this.isMockClient) {
      throw new Error('Not a DynamoDB client');
    }
    return this.client as DynamoDBDocumentClient;
  }
}