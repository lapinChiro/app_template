# TASK-020: CDK Project Setup

**Priority**: High  
**Estimated**: 2 hours  
**Dependencies**: TASK-001 (ディレクトリ構造)

## Prerequisites

- AWS アカウントとクレデンシャル
- AWS CDK の基本知識
- TypeScript の理解

## Reference Implementation

- Primary: `@docs/impl/infrastructure/cdk-stacks.md` - CDKスタック実装
- Security: `@docs/impl/security/best-practices.md` - AWS セキュリティ

## Acceptance Criteria

- [ ] CDK v2 で TypeScript プロジェクトが初期化されている
- [ ] 環境別設定（dev/stg/prod）が実装されている（cdk-stacks.md Section 5）
- [ ] Lambda は Node.js 22.x ランタイムを使用している
- [ ] コスト最適化タグが全リソースに設定されている
- [ ] `cdk synth` がエラーなく完了する
- [ ] `cdk diff` で変更内容が確認できる

## Detailed Implementation

### Environment Configuration
```typescript
// packages/infra/lib/config/environment.ts - 環境別設定
export interface EnvironmentConfig {
  account: string;
  region: string;
  stage: 'dev' | 'stg' | 'prod';
  domainName?: string;
  certificateArn?: string;
  removalPolicy: RemovalPolicy;
}

export const environments: Record<string, EnvironmentConfig> = {
  dev: {
    account: process.env.CDK_DEFAULT_ACCOUNT!,
    region: 'ap-northeast-1',
    stage: 'dev',
    removalPolicy: RemovalPolicy.DESTROY,
  },
  stg: {
    account: process.env.AWS_ACCOUNT_STG!,
    region: 'ap-northeast-1',
    stage: 'stg',
    removalPolicy: RemovalPolicy.SNAPSHOT,
  },
  prod: {
    account: process.env.AWS_ACCOUNT_PROD!,
    region: 'ap-northeast-1',
    stage: 'prod',
    domainName: 'api.example.com',
    certificateArn: process.env.ACM_CERTIFICATE_ARN,
    removalPolicy: RemovalPolicy.RETAIN,
  },
};
```

### Base Stack
```typescript
// packages/infra/lib/stacks/base-stack.ts - 基本スタック
export abstract class BaseStack extends Stack {
  protected readonly config: EnvironmentConfig;
  
  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id, props);
    
    this.config = props.config;
    
    // 全リソースへのタグ付け（cdk-stacks.md Section 5.2）
    Tags.of(this).add('Project', 'serverless-template');
    Tags.of(this).add('Stage', this.config.stage);
    Tags.of(this).add('ManagedBy', 'CDK');
    Tags.of(this).add('CostCenter', 
      this.config.stage === 'prod' ? 'production' : 'development'
    );
  }
  
  // Lambda デフォルト設定
  protected createLambdaFunction(
    id: string,
    props: Partial<FunctionProps>
  ): Function {
    return new Function(this, id, {
      runtime: Runtime.NODEJS_22_X, // Node.js 22 使用
      architecture: Architecture.ARM_64, // コスト最適化
      memorySize: 512,
      timeout: Duration.seconds(30),
      environment: {
        NODE_ENV: this.config.stage,
        LOG_LEVEL: this.config.stage === 'prod' ? 'info' : 'debug',
      },
      tracing: Tracing.ACTIVE,
      ...props,
    });
  }
}
```

### Deployment Scripts
```json
// package.json scripts
{
  "scripts": {
    "cdk": "cdk",
    "cdk:bootstrap": "cdk bootstrap",
    "cdk:synth": "cdk synth --all",
    "cdk:diff": "cdk diff --all",
    "cdk:deploy:dev": "cdk deploy --all --context stage=dev",
    "cdk:deploy:stg": "cdk deploy --all --context stage=stg --require-approval never",
    "cdk:deploy:prod": "cdk deploy --all --context stage=prod --require-approval any-change",
    "cdk:destroy:dev": "cdk destroy --all --context stage=dev"
  }
}
```

## Quality Gates

- CDK synth time: < 30 seconds
- CloudFormation template size: < 1MB
- Resource tagging: 100% coverage
- Security best practices: Pass cdk-nag

## Verification Steps

```bash
# AWS クレデンシャル確認
aws sts get-caller-identity

# CDK ブートストラップ（初回のみ）
pnpm cdk:bootstrap

# 合成と検証
pnpm cdk:synth

# セキュリティチェック
pnpm add -D cdk-nag
pnpm cdk synth | npx cdk-nag

# 差分確認
pnpm cdk:diff

# デプロイ（dev環境）
pnpm cdk:deploy:dev
```

## Output

- 本番レベルの CDK プロジェクト構造
- 環境別デプロイメント設定
- セキュリティとコスト最適化の実装

## Progress

- [ ] Started
- [ ] Implementation complete
- [ ] Verified
- [ ] Documented