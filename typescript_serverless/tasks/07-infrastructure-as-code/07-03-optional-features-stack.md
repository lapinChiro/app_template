# TASK-022: Optional Features Stack

**Priority**: Low  
**Estimated**: 3 hours  
**Dependencies**: TASK-021 (Core Infrastructure)

## Prerequisites

- AWS Step Functions の基本知識
- SQS と EventBridge の理解
- CloudWatch Insights の使用経験

## Reference Implementation

- Primary: `@docs/impl/infrastructure/cdk-stacks.md` - オプション機能
- Secondary: `@docs/impl/infrastructure/async-patterns.md` - 非同期パターン

## Acceptance Criteria

- [ ] 非同期ジョブ用 Lambda が実装されている
- [ ] SQS キューが DLQ 付きで設定されている
- [ ] EventBridge スケジュールが設定されている
- [ ] 監視ダッシュボードが拡張されている
- [ ] 条件付きデプロイが実装されている
- [ ] Step Functions ワークフローが定義されている

## Detailed Implementation

### Async Jobs Stack
```typescript
// packages/infra/lib/stacks/async-jobs-stack.ts
import { Stack, StackProps, Duration, CfnCondition, Fn } from 'aws-cdk-lib';
import { Queue, DeadLetterQueue } from 'aws-cdk-lib/aws-sqs';
import { Function, Runtime, Architecture } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { BaseStack } from './base-stack';

interface AsyncJobsStackProps extends StackProps {
  table: Table;
  enabled: boolean;
}

export class AsyncJobsStack extends BaseStack {
  public readonly jobQueue?: Queue;
  public readonly jobProcessor?: Function;

  constructor(scope: Construct, id: string, props: AsyncJobsStackProps) {
    super(scope, id, props);

    // Condition for optional deployment
    const condition = new CfnCondition(this, 'AsyncJobsEnabled', {
      expression: Fn.conditionEquals(props.enabled, true),
    });

    // Dead Letter Queue
    const dlq = new Queue(this, 'JobDLQ', {
      queueName: `${this.config.stage}-job-dlq`,
      retentionPeriod: Duration.days(14),
    });
    (dlq.node.defaultChild as any).cfnOptions.condition = condition;

    // Main job queue
    this.jobQueue = new Queue(this, 'JobQueue', {
      queueName: `${this.config.stage}-job-queue`,
      visibilityTimeout: Duration.minutes(6),
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
      },
    });
    (this.jobQueue.node.defaultChild as any).cfnOptions.condition = condition;

    // Job processor Lambda
    this.jobProcessor = new NodejsFunction(this, 'JobProcessor', {
      functionName: `${this.config.stage}-job-processor`,
      entry: '../../packages/functions/src/job-processor.ts',
      handler: 'handler',
      runtime: Runtime.NODEJS_22_X,
      architecture: Architecture.ARM_64,
      memorySize: 1024,
      timeout: Duration.minutes(5),
      environment: {
        TABLE_NAME: props.table.tableName,
        STAGE: this.config.stage,
      },
      reservedConcurrentExecutions: 10, // Limit concurrent executions
    });
    (this.jobProcessor.node.defaultChild as any).cfnOptions.condition = condition;

    // Grant permissions
    props.table.grantReadWriteData(this.jobProcessor);
    this.jobQueue.grantConsumeMessages(this.jobProcessor);

    // Add SQS trigger
    this.jobProcessor.addEventSource(
      new SqsEventSource(this.jobQueue, {
        batchSize: 10,
        maxBatchingWindowInMillis: 1000,
        reportBatchItemFailures: true,
      })
    );
  }
}
```

### Scheduled Tasks Stack
```typescript
// packages/infra/lib/stacks/scheduled-tasks-stack.ts
import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { BaseStack } from './base-stack';

interface ScheduledTasksStackProps extends StackProps {
  table: Table;
  enabled: boolean;
}

export class ScheduledTasksStack extends BaseStack {
  constructor(scope: Construct, id: string, props: ScheduledTasksStackProps) {
    super(scope, id, props);

    if (!props.enabled) {
      return;
    }

    // Daily cleanup task
    const cleanupFunction = new NodejsFunction(this, 'CleanupFunction', {
      functionName: `${this.config.stage}-cleanup-task`,
      entry: '../../packages/functions/src/cleanup-task.ts',
      handler: 'handler',
      runtime: Runtime.NODEJS_22_X,
      architecture: Architecture.ARM_64,
      memorySize: 512,
      timeout: Duration.minutes(15),
      environment: {
        TABLE_NAME: props.table.tableName,
        RETENTION_DAYS: '30',
      },
    });

    props.table.grantReadWriteData(cleanupFunction);

    // Schedule rule - daily at 2 AM JST (5 PM UTC)
    new Rule(this, 'CleanupRule', {
      schedule: Schedule.cron({
        minute: '0',
        hour: '17',
        day: '*',
        month: '*',
        year: '*',
      }),
      targets: [new LambdaFunction(cleanupFunction)],
      description: 'Daily cleanup of old records',
    });

    // Weekly report generation
    const reportFunction = new NodejsFunction(this, 'ReportFunction', {
      functionName: `${this.config.stage}-report-task`,
      entry: '../../packages/functions/src/report-task.ts',
      handler: 'handler',
      runtime: Runtime.NODEJS_22_X,
      architecture: Architecture.ARM_64,
      memorySize: 1024,
      timeout: Duration.minutes(10),
      environment: {
        TABLE_NAME: props.table.tableName,
        REPORT_BUCKET: process.env.REPORT_BUCKET || '',
      },
    });

    props.table.grantReadData(reportFunction);

    // Schedule rule - weekly on Monday at 9 AM JST (0 AM UTC)
    new Rule(this, 'ReportRule', {
      schedule: Schedule.cron({
        minute: '0',
        hour: '0',
        weekDay: 'MON',
      }),
      targets: [new LambdaFunction(reportFunction)],
      description: 'Weekly usage report generation',
    });
  }
}
```

### Step Functions Workflow
```typescript
// packages/infra/lib/stacks/workflow-stack.ts
import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { StateMachine, TaskInput, Wait, WaitTime, Succeed, Fail, Choice, Condition } from 'aws-cdk-lib/aws-stepfunctions';
import { LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export class WorkflowStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // Step 1: Validate input
    const validateFunction = new NodejsFunction(this, 'ValidateFunction', {
      entry: '../../packages/functions/src/workflow/validate.ts',
      handler: 'handler',
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
    });

    const validateTask = new LambdaInvoke(this, 'ValidateTask', {
      lambdaFunction: validateFunction,
      outputPath: '$.Payload',
    });

    // Step 2: Process data
    const processFunction = new NodejsFunction(this, 'ProcessFunction', {
      entry: '../../packages/functions/src/workflow/process.ts',
      handler: 'handler',
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.minutes(5),
    });

    const processTask = new LambdaInvoke(this, 'ProcessTask', {
      lambdaFunction: processFunction,
      outputPath: '$.Payload',
    });

    // Step 3: Notify completion
    const notifyFunction = new NodejsFunction(this, 'NotifyFunction', {
      entry: '../../packages/functions/src/workflow/notify.ts',
      handler: 'handler',
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
    });

    const notifyTask = new LambdaInvoke(this, 'NotifyTask', {
      lambdaFunction: notifyFunction,
      outputPath: '$.Payload',
    });

    // Wait state
    const wait = new Wait(this, 'Wait30Seconds', {
      time: WaitTime.duration(Duration.seconds(30)),
    });

    // Success/Failure states
    const success = new Succeed(this, 'Success');
    const failure = new Fail(this, 'Failure', {
      error: 'WorkflowFailed',
      cause: 'Processing failed',
    });

    // Choice state
    const checkStatus = new Choice(this, 'CheckStatus')
      .when(
        Condition.stringEquals('$.status', 'SUCCESS'),
        notifyTask.next(success)
      )
      .when(
        Condition.stringEquals('$.status', 'RETRY'),
        wait.next(processTask)
      )
      .otherwise(failure);

    // Define workflow
    const definition = validateTask
      .next(processTask)
      .next(checkStatus);

    // Create state machine
    new StateMachine(this, 'WorkflowStateMachine', {
      stateMachineName: `${props.stackName}-workflow`,
      definition,
      timeout: Duration.hours(1),
    });
  }
}
```

### Enhanced Monitoring Dashboard
```typescript
// packages/infra/lib/stacks/monitoring-enhanced-stack.ts
import { Stack, StackProps } from 'aws-cdk-lib';
import { Dashboard, GraphWidget, SingleValueWidget, LogQueryWidget } from 'aws-cdk-lib/aws-cloudwatch';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

interface MonitoringEnhancedStackProps extends StackProps {
  jobQueue?: Queue;
  jobProcessor?: Function;
  cleanupFunction?: Function;
}

export class MonitoringEnhancedStack extends Stack {
  constructor(scope: Construct, id: string, props: MonitoringEnhancedStackProps) {
    super(scope, id, props);

    const dashboard = new Dashboard(this, 'EnhancedDashboard', {
      dashboardName: `${props.stackName}-enhanced`,
    });

    // Async job metrics
    if (props.jobQueue && props.jobProcessor) {
      dashboard.addWidgets(
        new GraphWidget({
          title: 'Job Queue Metrics',
          left: [
            props.jobQueue.metricApproximateNumberOfMessagesVisible({
              label: 'Visible Messages',
            }),
            props.jobQueue.metricApproximateNumberOfMessagesNotVisible({
              label: 'In Flight',
            }),
          ],
          right: [
            props.jobQueue.metricNumberOfMessagesSent({
              label: 'Messages Sent',
            }),
          ],
        }),
        new GraphWidget({
          title: 'Job Processing',
          left: [
            props.jobProcessor.metricInvocations(),
            props.jobProcessor.metricErrors(),
          ],
          right: [
            props.jobProcessor.metricDuration(),
          ],
        })
      );
    }

    // CloudWatch Insights query widget
    dashboard.addWidgets(
      new LogQueryWidget({
        title: 'Error Analysis',
        logGroupNames: [
          `/aws/lambda/${props.jobProcessor?.functionName}`,
        ],
        queryLines: [
          'fields @timestamp, @message',
          'filter @message like /ERROR/',
          'sort @timestamp desc',
          'limit 20',
        ],
        width: 24,
        height: 6,
      })
    );

    // Cost tracking widget
    dashboard.addWidgets(
      new SingleValueWidget({
        title: 'Estimated Monthly Cost',
        metrics: [
          // Custom metric for cost tracking
        ],
        setPeriodToTimeRange: true,
        width: 6,
        height: 4,
      })
    );
  }
}
```

### Lambda Function Implementations
```typescript
// packages/functions/src/job-processor.ts
import { SQSHandler, SQSBatchResponse } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler: SQSHandler = async (event) => {
  const batchItemFailures: SQSBatchResponse['batchItemFailures'] = [];

  for (const record of event.Records) {
    try {
      const job = JSON.parse(record.body);
      
      // Process job
      await processJob(job);
      
      // Update job status
      await docClient.send(
        new PutCommand({
          TableName: process.env.TABLE_NAME!,
          Item: {
            PK: `JOB#${job.id}`,
            SK: `STATUS#${new Date().toISOString()}`,
            status: 'COMPLETED',
            completedAt: new Date().toISOString(),
          },
        })
      );
    } catch (error) {
      console.error('Failed to process job:', error);
      batchItemFailures.push({
        itemIdentifier: record.messageId,
      });
    }
  }

  return {
    batchItemFailures,
  };
};

async function processJob(job: any): Promise<void> {
  // Job processing logic
  console.log('Processing job:', job);
  
  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

### Conditional Deployment
```typescript
// packages/infra/bin/app.ts
import { App } from 'aws-cdk-lib';
import { ApplicationStack } from '../lib/stacks/app-stack';
import { AsyncJobsStack } from '../lib/stacks/async-jobs-stack';
import { ScheduledTasksStack } from '../lib/stacks/scheduled-tasks-stack';

const app = new App();

const stage = app.node.tryGetContext('stage') || 'dev';
const features = {
  asyncJobs: app.node.tryGetContext('enableAsyncJobs') === 'true',
  scheduledTasks: app.node.tryGetContext('enableScheduledTasks') === 'true',
  monitoring: app.node.tryGetContext('enableMonitoring') === 'true',
};

// Core stacks
const appStack = new ApplicationStack(app, `${stage}-serverless-template`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

// Optional stacks
if (features.asyncJobs) {
  new AsyncJobsStack(app, `${stage}-async-jobs`, {
    table: appStack.databaseStack.table,
    enabled: features.asyncJobs,
  });
}

if (features.scheduledTasks) {
  new ScheduledTasksStack(app, `${stage}-scheduled-tasks`, {
    table: appStack.databaseStack.table,
    enabled: features.scheduledTasks,
  });
}
```

## Quality Gates

- Lambda cold start: < 1 second
- SQS message processing: < 30 seconds
- Step Functions execution: < 5 minutes
- Cost optimization: Pay-per-use model

## Verification Steps

```bash
# 条件付きデプロイ
pnpm cdk deploy --all \
  --context enableAsyncJobs=true \
  --context enableScheduledTasks=true

# SQS キューテスト
aws sqs send-message \
  --queue-url https://sqs.region.amazonaws.com/account/dev-job-queue \
  --message-body '{"id":"test-1","type":"process","data":{"test":true}}'

# EventBridge ルール確認
aws events list-rules --name-prefix dev-

# Step Functions 実行
aws stepfunctions start-execution \
  --state-machine-arn arn:aws:states:region:account:stateMachine:dev-workflow \
  --input '{"jobId":"test-1"}'

# CloudWatch ダッシュボード確認
open https://console.aws.amazon.com/cloudwatch/home?region=ap-northeast-1#dashboards:name=dev-serverless-template-enhanced
```

## Output

- オプション機能の完全な IaC 定義
- 条件付きデプロイメント設定
- 拡張監視ダッシュボード

## Progress

- [ ] Started
- [ ] Implementation complete
- [ ] Verified
- [ ] Documented