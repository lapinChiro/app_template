# TASK-021: Core Infrastructure Stack

**Priority**: High  
**Estimated**: 4 hours  
**Dependencies**: TASK-020 (CDK Setup)

## Prerequisites

- AWS CDK の実践的知識
- AWS サービスの理解（DynamoDB, S3, CloudFront, API Gateway, Lambda）
- インフラストラクチャ設計の基本

## Reference Implementation

- Primary: `@docs/impl/infrastructure/cdk-stacks.md` - CDKスタック実装
- Secondary: `@docs/impl/infrastructure/dynamodb-design.md` - DynamoDB設計

## Acceptance Criteria

- [ ] DynamoDB テーブルが Single Table Design で定義されている
- [ ] S3 バケットが静的ホスティング用に設定されている
- [ ] CloudFront ディストリビューションが作成されている
- [ ] API Gateway が REST API として設定されている
- [ ] Lambda 関数が適切に定義されている
- [ ] 全リソースに適切なタグが設定されている

## Detailed Implementation

### Database Stack
```typescript
// packages/infra/lib/stacks/database-stack.ts
import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Table, AttributeType, BillingMode, TableEncryption } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { BaseStack } from './base-stack';

export class DatabaseStack extends BaseStack {
  public readonly table: Table;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // Main table with Single Table Design
    this.table = new Table(this, 'MainTable', {
      tableName: `${this.config.stage}-serverless-template`,
      partitionKey: {
        name: 'PK',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'SK',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      encryption: TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: this.config.stage === 'prod',
      removalPolicy: this.config.removalPolicy,
      timeToLiveAttribute: 'TTL',
    });

    // GSI1: Email lookup
    this.table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: {
        name: 'GSI1PK',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'GSI1SK',
        type: AttributeType.STRING,
      },
    });

    // GSI2: Time-based queries
    this.table.addGlobalSecondaryIndex({
      indexName: 'GSI2',
      partitionKey: {
        name: 'GSI2PK',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'GSI2SK',
        type: AttributeType.STRING,
      },
    });

    // Outputs
    this.exportValue(this.table.tableName, {
      name: `${this.config.stage}-table-name`,
    });
  }
}
```

### Storage Stack
```typescript
// packages/infra/lib/stacks/storage-stack.ts
import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Bucket, BucketEncryption, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Distribution, ViewerProtocolPolicy, OriginAccessIdentity, AllowedMethods } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';
import { BaseStack } from './base-stack';

export class StorageStack extends BaseStack {
  public readonly webBucket: Bucket;
  public readonly distribution: Distribution;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // S3 bucket for static hosting
    this.webBucket = new Bucket(this, 'WebBucket', {
      bucketName: `${this.config.stage}-serverless-template-web`,
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: this.config.removalPolicy,
      autoDeleteObjects: this.config.stage !== 'prod',
      versioned: this.config.stage === 'prod',
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: Duration.days(30),
          enabled: true,
        },
      ],
    });

    // CloudFront OAI
    const originAccessIdentity = new OriginAccessIdentity(this, 'OAI', {
      comment: `OAI for ${this.config.stage} web bucket`,
    });

    this.webBucket.grantRead(originAccessIdentity);

    // CloudFront distribution
    this.distribution = new Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new S3Origin(this.webBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
        compress: true,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responsePagePath: '/index.html',
          responseHttpStatus: 200,
          ttl: Duration.seconds(300),
        },
      ],
      domainNames: this.config.domainName ? [this.config.domainName] : undefined,
      certificate: this.config.certificateArn ? 
        Certificate.fromCertificateArn(this, 'Certificate', this.config.certificateArn) : 
        undefined,
      priceClass: PriceClass.PRICE_CLASS_200,
    });

    // Deploy static files
    new BucketDeployment(this, 'DeployWebsite', {
      sources: [Source.asset('../../apps/web-member/out')],
      destinationBucket: this.webBucket,
      distribution: this.distribution,
      distributionPaths: ['/*'],
    });

    // Outputs
    this.exportValue(this.distribution.distributionDomainName, {
      name: `${this.config.stage}-cloudfront-domain`,
    });
  }
}
```

### API Stack
```typescript
// packages/infra/lib/stacks/api-stack.ts
import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { RestApi, LambdaIntegration, Cors, MethodLoggingLevel, RequestValidator } from 'aws-cdk-lib/aws-apigateway';
import { Function, Runtime, Architecture, Tracing, Code } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { BaseStack } from './base-stack';

interface ApiStackProps extends StackProps {
  table: Table;
}

export class ApiStack extends BaseStack {
  public readonly api: RestApi;
  public readonly memberApiFunction: Function;
  public readonly adminApiFunction: Function;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // API Gateway
    this.api = new RestApi(this, 'Api', {
      restApiName: `${this.config.stage}-serverless-template-api`,
      description: 'Serverless Template API',
      deployOptions: {
        stageName: this.config.stage,
        tracingEnabled: true,
        loggingLevel: MethodLoggingLevel.INFO,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
        allowCredentials: true,
      },
    });

    // Request validator
    const requestValidator = new RequestValidator(this, 'RequestValidator', {
      restApi: this.api,
      validateRequestBody: true,
      validateRequestParameters: true,
    });

    // Member API Lambda
    this.memberApiFunction = new NodejsFunction(this, 'MemberApiFunction', {
      functionName: `${this.config.stage}-member-api`,
      entry: '../../apps/api-member/src/index.ts',
      handler: 'handler',
      runtime: Runtime.NODEJS_22_X,
      architecture: Architecture.ARM_64,
      memorySize: 1024,
      timeout: Duration.seconds(30),
      environment: {
        NODE_ENV: this.config.stage,
        TABLE_NAME: props.table.tableName,
        STAGE: this.config.stage,
        JWT_SECRET: process.env.JWT_SECRET!,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
      },
      tracing: Tracing.ACTIVE,
      bundling: {
        minify: this.config.stage === 'prod',
        sourceMap: this.config.stage !== 'prod',
        externalModules: ['@aws-sdk/*'],
      },
    });

    // Admin API Lambda
    this.adminApiFunction = new NodejsFunction(this, 'AdminApiFunction', {
      functionName: `${this.config.stage}-admin-api`,
      entry: '../../apps/api-admin/src/index.ts',
      handler: 'handler',
      runtime: Runtime.NODEJS_22_X,
      architecture: Architecture.ARM_64,
      memorySize: 1024,
      timeout: Duration.seconds(30),
      environment: {
        NODE_ENV: this.config.stage,
        TABLE_NAME: props.table.tableName,
        STAGE: this.config.stage,
        JWT_SECRET: process.env.JWT_SECRET!,
      },
      tracing: Tracing.ACTIVE,
      bundling: {
        minify: this.config.stage === 'prod',
        sourceMap: this.config.stage !== 'prod',
        externalModules: ['@aws-sdk/*'],
      },
    });

    // Grant DynamoDB permissions
    props.table.grantReadWriteData(this.memberApiFunction);
    props.table.grantReadWriteData(this.adminApiFunction);

    // API routes
    const memberApi = this.api.root.addResource('api').addResource('member');
    const adminApi = this.api.root.addResource('api').addResource('admin');

    // Member API integration
    const memberIntegration = new LambdaIntegration(this.memberApiFunction);
    memberApi.addProxy({
      defaultIntegration: memberIntegration,
      anyMethod: true,
    });

    // Admin API integration
    const adminIntegration = new LambdaIntegration(this.adminApiFunction);
    adminApi.addProxy({
      defaultIntegration: adminIntegration,
      anyMethod: true,
    });

    // Outputs
    this.exportValue(this.api.url, {
      name: `${this.config.stage}-api-url`,
    });
  }
}
```

### Main Application Stack
```typescript
// packages/infra/lib/stacks/app-stack.ts
import { App, Stack, StackProps } from 'aws-cdk-lib';
import { DatabaseStack } from './database-stack';
import { StorageStack } from './storage-stack';
import { ApiStack } from './api-stack';
import { MonitoringStack } from './monitoring-stack';

export class ApplicationStack extends Stack {
  constructor(scope: App, id: string, props: StackProps) {
    super(scope, id, props);

    // Database
    const databaseStack = new DatabaseStack(this, 'DatabaseStack', props);

    // Storage & CDN
    const storageStack = new StorageStack(this, 'StorageStack', props);

    // API
    const apiStack = new ApiStack(this, 'ApiStack', {
      ...props,
      table: databaseStack.table,
    });

    // Add dependencies
    apiStack.addDependency(databaseStack);
  }
}
```

### Monitoring Stack
```typescript
// packages/infra/lib/stacks/monitoring-stack.ts
import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Dashboard, GraphWidget, Metric, TextWidget } from 'aws-cdk-lib/aws-cloudwatch';
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface MonitoringStackProps extends StackProps {
  memberApiFunction: Function;
  adminApiFunction: Function;
  table: Table;
}

export class MonitoringStack extends Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // SNS topic for alarms
    const alarmTopic = new Topic(this, 'AlarmTopic', {
      displayName: `${props.stackName} Alarms`,
    });

    if (process.env.ALARM_EMAIL) {
      alarmTopic.addSubscription(
        new EmailSubscription(process.env.ALARM_EMAIL)
      );
    }

    // CloudWatch Dashboard
    const dashboard = new Dashboard(this, 'Dashboard', {
      dashboardName: `${props.stackName}-dashboard`,
    });

    // Lambda metrics
    dashboard.addWidgets(
      new GraphWidget({
        title: 'Lambda Invocations',
        left: [
          props.memberApiFunction.metricInvocations(),
          props.adminApiFunction.metricInvocations(),
        ],
      }),
      new GraphWidget({
        title: 'Lambda Errors',
        left: [
          props.memberApiFunction.metricErrors(),
          props.adminApiFunction.metricErrors(),
        ],
      })
    );

    // DynamoDB metrics
    dashboard.addWidgets(
      new GraphWidget({
        title: 'DynamoDB Read/Write',
        left: [
          props.table.metricConsumedReadCapacityUnits(),
          props.table.metricConsumedWriteCapacityUnits(),
        ],
      })
    );

    // Lambda error alarm
    props.memberApiFunction.metricErrors().createAlarm(this, 'MemberApiErrors', {
      threshold: 5,
      evaluationPeriods: 1,
      alarmDescription: 'Member API errors exceeded threshold',
    }).addAlarmAction(new SnsAction(alarmTopic));
  }
}
```

## Quality Gates

- Infrastructure cost: < $50/month (dev environment)
- Deployment time: < 5 minutes
- Resource tagging: 100% coverage
- Security best practices: Pass AWS Well-Architected review

## Verification Steps

```bash
# CDK 合成
pnpm cdk synth

# デプロイプラン確認
pnpm cdk diff

# デプロイ実行
pnpm cdk deploy --all

# スタック出力確認
aws cloudformation describe-stacks \
  --stack-name dev-serverless-template \
  --query 'Stacks[0].Outputs'

# リソース確認
aws dynamodb describe-table --table-name dev-serverless-template
aws s3 ls s3://dev-serverless-template-web/
aws apigateway get-rest-apis

# CloudFront アクセステスト
curl -I https://d1234567890.cloudfront.net
```

## Output

- 完全な基本インフラストラクチャ定義
- デプロイ可能な CDK スタック
- 監視ダッシュボード付き

## Progress

- [ ] Started
- [ ] Implementation complete
- [ ] Verified
- [ ] Documented