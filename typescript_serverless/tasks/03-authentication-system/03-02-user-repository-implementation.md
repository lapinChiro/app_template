# TASK-009: User Repository Implementation

**Priority**: High  
**Estimated**: 3 hours  
**Dependencies**: TASK-007 (Zod Schemas)

## Prerequisites

- DynamoDB の基本知識
- Single Table Design の理解
- TypeScript のジェネリクス

## Reference Implementation

- Primary: `@docs/impl/api/dynamodb-repository.md` - DynamoDBリポジトリパターン
- Secondary: `@docs/impl/infrastructure/cdk-stacks.md` - DynamoDBテーブル設定

## Acceptance Criteria

- [ ] UserRepository インターフェースが定義されている
- [ ] DynamoDB 実装クラスが作成されている
- [ ] Single Table Design が実装されている
- [ ] CRUD 操作が型安全に実装されている
- [ ] クエリが最適化されている（GSI の活用）
- [ ] エラーハンドリングが適切に実装されている

## Detailed Implementation

### Repository Interface
```typescript
// packages/shared/src/repositories/user.repository.ts
import { User } from '../schemas/user';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(options?: {
    limit?: number;
    lastEvaluatedKey?: string;
  }): Promise<{
    items: User[];
    lastEvaluatedKey?: string;
  }>;
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  update(id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User>;
  delete(id: string): Promise<void>;
}
```

### DynamoDB Implementation
```typescript
// packages/shared/src/repositories/dynamodb/user.repository.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand, PutCommand, UpdateCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { UserRepository } from '../user.repository';
import { User, UserSchema } from '../../schemas/user';

export class DynamoDBUserRepository implements UserRepository {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(client: DynamoDBClient, tableName: string) {
    this.docClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    });
    this.tableName = tableName;
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `USER#${id}`,
          SK: `USER#${id}`,
        },
      })
    );

    if (!result.Item) {
      return null;
    }

    return this.mapToUser(result.Item);
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `EMAIL#${email.toLowerCase()}`,
        },
        Limit: 1,
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    return this.mapToUser(result.Items[0]);
  }

  async findAll(options?: { limit?: number; lastEvaluatedKey?: string }) {
    const result = await this.docClient.send(
      new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'begins_with(PK, :pk)',
        ExpressionAttributeValues: {
          ':pk': 'USER#',
        },
        Limit: options?.limit || 20,
        ExclusiveStartKey: options?.lastEvaluatedKey ? 
          JSON.parse(Buffer.from(options.lastEvaluatedKey, 'base64').toString()) : 
          undefined,
      })
    );

    return {
      items: (result.Items || []).map(item => this.mapToUser(item)),
      lastEvaluatedKey: result.LastEvaluatedKey ? 
        Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64') :
        undefined,
    };
  }

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const user: User = {
      ...userData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    // Validate with Zod
    const validated = UserSchema.parse(user);

    const item = {
      PK: `USER#${id}`,
      SK: `USER#${id}`,
      GSI1PK: `EMAIL#${validated.email.toLowerCase()}`,
      GSI1SK: `USER#${id}`,
      ...validated,
    };

    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item,
        ConditionExpression: 'attribute_not_exists(PK)',
      })
    );

    return validated;
  }

  async update(id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const result = await this.docClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: `USER#${id}`,
          SK: `USER#${id}`,
        },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: 'attribute_exists(PK)',
        ReturnValues: 'ALL_NEW',
      })
    );

    if (!result.Attributes) {
      throw new Error('User not found');
    }

    return this.mapToUser(result.Attributes);
  }

  async delete(id: string): Promise<void> {
    await this.docClient.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: {
          PK: `USER#${id}`,
          SK: `USER#${id}`,
        },
        ConditionExpression: 'attribute_exists(PK)',
      })
    );
  }

  private mapToUser(item: Record<string, any>): User {
    const { PK, SK, GSI1PK, GSI1SK, ...userData } = item;
    return UserSchema.parse(userData);
  }
}
```

### Repository Factory
```typescript
// packages/shared/src/repositories/factory.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { UserRepository } from './user.repository';
import { DynamoDBUserRepository } from './dynamodb/user.repository';

export interface RepositoryConfig {
  region: string;
  tableName: string;
  endpoint?: string; // For local development
}

export class RepositoryFactory {
  private readonly client: DynamoDBClient;
  private readonly tableName: string;

  constructor(config: RepositoryConfig) {
    this.client = new DynamoDBClient({
      region: config.region,
      endpoint: config.endpoint,
    });
    this.tableName = config.tableName;
  }

  createUserRepository(): UserRepository {
    return new DynamoDBUserRepository(this.client, this.tableName);
  }
}
```

### Usage Example
```typescript
// apps/api-member/src/services/user.service.ts
import { RepositoryFactory } from '@shared/repositories';

const factory = new RepositoryFactory({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  tableName: process.env.DYNAMODB_TABLE_NAME || 'serverless-template',
  endpoint: process.env.DYNAMODB_ENDPOINT, // For local dev
});

const userRepository = factory.createUserRepository();

// Usage
const user = await userRepository.findByEmail('user@example.com');
const allUsers = await userRepository.findAll({ limit: 10 });
```

## Quality Gates

- TypeScript errors: 0
- Test coverage: > 90%
- Query performance: < 50ms (single item)
- Batch operations: < 200ms (20 items)

## Verification Steps

```bash
# 型チェック
pnpm tsc --noEmit

# ユニットテスト
pnpm test packages/shared/src/repositories

# DynamoDB Local でのテスト
docker compose up dynamodb -d
pnpm test:integration packages/shared/src/repositories

# パフォーマンステスト
pnpm test:performance --filter="UserRepository"
```

## Output

- 型安全な UserRepository 実装
- 効率的な DynamoDB アクセス（Single Table Design）
- 再利用可能なリポジトリパターン

## Progress

- [ ] Started
- [ ] Implementation complete
- [ ] Verified
- [ ] Documented