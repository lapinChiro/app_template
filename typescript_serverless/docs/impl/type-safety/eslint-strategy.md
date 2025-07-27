# Ultimate Type Safety ESLint Strategy

## Overview

このドキュメントは、`.eslintrc.js`で実装されている究極型安全性戦略の詳細な実装指針を提供します。これは「The Pragmatic Programmer」の原則、t_wadaのTDD実践、そして「Effective TypeScript」の原則に基づいています。

## Core Philosophy

### t_wada's TDD Practices Integration

- **RED**: テストを書いて失敗させる（型エラーも含む）
- **GREEN**: 最小限の実装で型エラーとテストをパスさせる
- **REFACTOR**: 型安全性を保ちながらリファクタリング

### Effective TypeScript Principles

- **Item 28**: Use Types, Not Strings, to Represent Valid States
- **Item 29**: Be Liberal in What You Accept and Strict in What You Produce
- **Item 48**: Use TSDoc for API Comments
- **Item 50**: Prefer Conditional Types to Overloaded Declarations

## 7-Layer Type Safety Architecture

### Layer 1: Complete `any` Elimination

```javascript
// .eslintrc.js
rules: {
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-unsafe-assignment': 'error',
  '@typescript-eslint/no-unsafe-member-access': 'error',
  '@typescript-eslint/no-unsafe-call': 'error',
  '@typescript-eslint/no-unsafe-return': 'error',
  '@typescript-eslint/no-unsafe-argument': 'error',
}
```

**Implementation Examples:**

```typescript
// ❌ 禁止される危険なコード
function processData(data: any) {
  return data.someProperty.toString(); // 実行時エラー可能性
}

// ✅ 型安全なアプローチ
interface ProcessableData {
  readonly someProperty: string | number;
}

function processData(data: ProcessableData): string {
  return String(data.someProperty); // 100%安全
}
```

### Layer 2: Function Boundary Safety

```javascript
// .eslintrc.js
rules: {
  '@typescript-eslint/explicit-function-return-type': ['error', {
    allowExpressions: true,
    allowTypedFunctionExpressions: true,
    allowHigherOrderFunctions: true,
    allowDirectConstAssertionInArrowFunctions: true,
  }],
  '@typescript-eslint/explicit-module-boundary-types': 'error',
}
```

**Implementation Examples:**

```typescript
// ❌ 型が不明確な関数
function createUser(data) {
  return { id: generateId(), ...data };
}

// ✅ 明示的な型境界
interface CreateUserInput {
  readonly name: string;
  readonly email: string;
}

interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

function createUser(data: CreateUserInput): User {
  return {
    id: generateId(),
    name: data.name,
    email: data.email,
  };
}
```

### Layer 3: Null/Undefined Complete Safety

```javascript
// .eslintrc.js
rules: {
  '@typescript-eslint/no-non-null-assertion': 'error',
  '@typescript-eslint/prefer-nullish-coalescing': 'error',
  '@typescript-eslint/prefer-optional-chain': 'error',
  '@typescript-eslint/strict-boolean-expressions': ['error', {
    allowNullableBoolean: true,
    allowNullableObject: true,
    allowNumber: false,
    allowString: false,
    allowNullableString: false,
    allowNullableNumber: false
  }],
}
```

**Implementation Examples:**

```typescript
// ❌ 危険なnull処理
function getUserName(user: User | undefined): string {
  return user!.name; // 実行時エラー可能性
}

// ✅ 安全なnull処理
function getUserName(user: User | undefined): string {
  return user?.name ?? 'Unknown User';
}

// ❌ 曖昧なboolean判定
function isValidInput(input: string): boolean {
  return !!input; // 空文字列でfalse
}

// ✅ 明示的なboolean判定
function isValidInput(input: string): boolean {
  return input.length > 0;
}
```

### Layer 4: Promise/Async Complete Safety

```javascript
// .eslintrc.js
rules: {
  '@typescript-eslint/await-thenable': 'error',
  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/no-misused-promises': 'error',
  '@typescript-eslint/require-await': 'error',
}
```

**Implementation Examples:**

```typescript
// ❌ 危険な非同期処理
async function processUsers(users: User[]) {
  users.forEach(user => updateUser(user)); // Promise未処理
}

// ✅ 安全な非同期処理
async function processUsers(users: User[]): Promise<void> {
  await Promise.all(users.map(user => updateUser(user)));
}

// ❌ Promise誤用
function validateUsers(users: User[]): boolean {
  return users.every(validateUser); // async関数をbooleanで評価
}

// ✅ 適切なPromise処理
async function validateUsers(users: User[]): Promise<boolean> {
  const results = await Promise.all(users.map(user => validateUser(user)));
  return results.every(Boolean);
}
```

### Layer 5: Code Quality Gates

```javascript
// .eslintrc.js
rules: {
  complexity: ['error', 15],
  'max-lines-per-function': ['error', { max: 75 }],
  'max-lines': ['error', { max: 200 }],
  'no-console': 'error',
}
```

**Implementation Examples:**

```typescript
// ❌ 複雑すぎる関数（複雑度 > 10）
function processComplexData(data: unknown): string {
  if (typeof data === 'string') {
    if (data.length > 0) {
      if (data.includes('@')) {
        if (data.startsWith('admin')) {
          if (data.endsWith('.com')) {
            // ... 複雑な条件が続く
          }
        }
      }
    }
  }
  return '';
}

// ✅ シンプルで理解しやすい関数
function isAdminEmail(input: unknown): boolean {
  return (
    typeof input === 'string' &&
    input.startsWith('admin') &&
    input.includes('@') &&
    input.endsWith('.com')
  );
}

function processEmailData(data: unknown): string {
  if (!isAdminEmail(data)) {
    return '';
  }
  return processAdminEmail(data);
}
```

### Layer 6: Documentation Enforcement

```javascript
// .eslintrc.js
rules: {
  'tsdoc/syntax': 'error',
}
```

**Implementation Examples:**

````typescript
/**
 * ユーザーを作成し、データベースに保存します
 *
 * @param input - ユーザー作成に必要な入力データ
 * @returns 作成されたユーザーオブジェクト
 * @throws {ValidationError} 入力データが無効な場合
 *
 * @example
 * ```typescript
 * const user = await createUser({
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * });
 * ```
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  const validatedInput = validateUserInput(input);
  return await userRepository.create(validatedInput);
}
````

### Layer 7: Dependency Management

```javascript
// .eslintrc.js
rules: {
  'import/order': ['error', {
    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
    'newlines-between': 'always',
    alphabetize: { order: 'asc', caseInsensitive: true },
  }],
  'import/no-duplicates': 'error',
  'import/no-cycle': 'error',
  'import/no-self-import': 'error',
}
```

**Implementation Examples:**

```typescript
// ✅ 適切なimport順序
import { readFile } from 'fs/promises';
import path from 'path';

import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

import { createUser } from '@/lib/user';
import { validateInput } from '@/lib/validation';

import { UserSchema } from '../schemas/user';
import { logger } from '../utils/logger';

import type { CreateUserInput } from './types';
```

## Quality Gate Integration

### Pre-commit Hooks

```bash
#!/bin/sh
# .husky/pre-commit

# Type check
npm run type-check || exit 1

# Lint check
npm run lint || exit 1

# Unit tests
npm run test:unit || exit 1

# Security audit
npm audit --audit-level high || exit 1
```

### CI/CD Pipeline

```yaml
# .github/workflows/quality.yml
name: Quality Gates

on: [push, pull_request]

jobs:
  type-safety:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint -- --max-warnings=0
      - run: npm run test:unit -- --coverage
```

## Metrics and Monitoring

### Success Metrics

- **ESLint Errors**: 0 (zero tolerance)
- **ESLint Warnings**: 0 (zero tolerance)
- **TypeScript Errors**: 0 (zero tolerance)
- **Test Coverage**: 90%+ (high quality assurance)
- **Runtime Errors**: Target 0 (ultimate goal)

### Monitoring Dashboard

```typescript
interface QualityMetrics {
  readonly lintErrors: number;
  readonly lintWarnings: number;
  readonly typeErrors: number;
  readonly testCoverage: number;
  readonly runtimeErrors: number;
  readonly complexityViolations: number;
}

/**
 * プロジェクトの品質メトリクスを収集します
 */
export async function collectQualityMetrics(): Promise<QualityMetrics> {
  // 実装詳細...
}
```

## Best Practices

### 1. Gradual Type Safety Introduction

新規プロジェクトでは最初から全ルールを適用し、既存プロジェクトでは段階的に導入：

```javascript
// Stage 1: 基本的な型安全性
'@typescript-eslint/no-explicit-any': 'warn',

// Stage 2: 厳格化
'@typescript-eslint/no-explicit-any': 'error',

// Stage 3: 完全な型安全性
'@typescript-eslint/no-unsafe-*': 'error',
```

### 2. Team Education

- 定期的な型安全性レビュー会の実施
- 実行時エラー事例の共有と分析
- 型安全性ベストプラクティスの文書化

### 3. Tool Integration

- VS Code拡張機能の推奨設定
- リアルタイムlint表示の有効化
- 自動フィックス機能の活用

## Complete tsconfig.json Configuration

### Ultimate Type Safety tsconfig.json

```json
{
  "compilerOptions": {
    // Type Checking - 最も厳格な型チェック設定
    "strict": true, // すべての厳格な型チェックオプションを有効化
    "noImplicitAny": true, // 暗黙的なany型を禁止
    "strictNullChecks": true, // null/undefinedの厳密なチェック
    "strictFunctionTypes": true, // 関数型の厳密なチェック
    "strictBindCallApply": true, // bind/call/applyの厳密なチェック
    "strictPropertyInitialization": true, // クラスプロパティの初期化を強制
    "noImplicitThis": true, // 暗黙的なthis型を禁止
    "useUnknownInCatchVariables": true, // catch節の変数をunknown型として扱う
    "alwaysStrict": true, // "use strict"を常に出力

    // Additional Checks - 追加の品質チェック
    "noUnusedLocals": true, // 未使用のローカル変数を検出
    "noUnusedParameters": true, // 未使用のパラメータを検出
    "exactOptionalPropertyTypes": true, // オプショナルプロパティの厳密な型チェック
    "noImplicitReturns": true, // すべてのコードパスで値を返すことを強制
    "noFallthroughCasesInSwitch": true, // switch文のフォールスルーを検出
    "noUncheckedIndexedAccess": true, // インデックスアクセスの結果をundefined可能として扱う
    "noImplicitOverride": true, // overrideキーワードの使用を強制
    "noPropertyAccessFromIndexSignature": true, // インデックスシグネチャからのプロパティアクセスを禁止
    "allowUnusedLabels": false, // 未使用のラベルを禁止
    "allowUnreachableCode": false, // 到達不可能なコードを禁止

    // Module Resolution - モジュール解決設定
    "module": "esnext", // 最新のESモジュール形式を使用
    "moduleResolution": "bundler", // バンドラー用のモジュール解決
    "resolveJsonModule": true, // JSONファイルのインポートを許可
    "allowJs": false, // JavaScriptファイルを禁止（型安全性のため）
    "esModuleInterop": true, // CommonJSモジュールとの相互運用性
    "allowSyntheticDefaultImports": true, // デフォルトインポートの合成を許可
    "forceConsistentCasingInFileNames": true, // ファイル名の大文字小文字の一貫性を強制
    "isolatedModules": true, // 各ファイルを独立したモジュールとして扱う

    // Language and Environment - 言語と環境設定
    "target": "es2022", // 最新のECMAScript機能を使用
    "lib": ["es2022", "dom", "dom.iterable"], // 使用可能なライブラリ定義
    "jsx": "preserve", // JSXをそのまま保持（Next.jsなどのフレームワーク用）

    // Emit - 出力設定
    "noEmit": true, // TypeScriptによるファイル出力を無効化（バンドラー使用前提）
    "declaration": true, // 型定義ファイルを生成
    "declarationMap": true, // 型定義のソースマップを生成
    "sourceMap": true, // ソースマップを生成
    "removeComments": false, // コメントを保持（ドキュメント用）
    "importHelpers": true, // TypeScriptヘルパーのインポートを使用
    "importsNotUsedAsValues": "error", // 型のみのインポートの処理を厳格化
    "downlevelIteration": true, // 古い環境でのイテレーション互換性
    "preserveConstEnums": false, // const enumを通常のenumに変換

    // Decorators - デコレータ設定（必要に応じて）
    "experimentalDecorators": true, // 実験的なデコレータサポート
    "emitDecoratorMetadata": true, // デコレータのメタデータを出力

    // Advanced - 高度な設定
    "skipLibCheck": true, // 型定義ファイルの型チェックをスキップ（ビルド高速化）
    "incremental": true, // インクリメンタルビルドを有効化
    "tsBuildInfoFile": ".tsbuildinfo", // ビルド情報ファイルのパス

    // Path Mapping - パスマッピング
    "baseUrl": ".", // パス解決のベースディレクトリ
    "paths": {
      "@/*": ["src/*"], // srcディレクトリへのエイリアス
      "@components/*": ["src/components/*"], // コンポーネントへのエイリアス
      "@lib/*": ["src/lib/*"], // ライブラリへのエイリアス
      "@utils/*": ["src/utils/*"], // ユーティリティへのエイリアス
      "@types/*": ["src/types/*"], // 型定義へのエイリアス
      "@hooks/*": ["src/hooks/*"], // カスタムフックへのエイリアス
      "@services/*": ["src/services/*"], // サービス層へのエイリアス
      "@config/*": ["src/config/*"] // 設定ファイルへのエイリアス
    }
  },

  // Files and Directories - ファイルとディレクトリ設定
  "include": [
    "src/**/*", // srcディレクトリ内のすべてのファイル
    "tests/**/*", // testsディレクトリ内のすべてのファイル
    "next-env.d.ts", // Next.js型定義（使用する場合）
    "**/*.ts", // すべてのTypeScriptファイル
    "**/*.tsx" // すべてのTypeScript JSXファイル
  ],

  "exclude": [
    "node_modules", // 依存関係を除外
    "dist", // ビルド出力を除外
    "build", // ビルドディレクトリを除外
    ".next", // Next.jsビルド出力を除外
    "coverage", // テストカバレッジを除外
    "**/*.spec.ts", // テストファイルを除外（必要に応じて）
    "**/*.test.ts", // テストファイルを除外（必要に応じて）
    "**/*.js", // JavaScriptファイルを除外
    "**/*.d.ts" // 型定義ファイルを除外（自動生成されるもの）
  ],

  // Type Acquisition - 型定義の自動取得（VS Code用）
  "typeAcquisition": {
    "enable": false // 自動型取得を無効化（明示的な管理を推奨）
  },

  // Watch Options - ファイル監視オプション
  "watchOptions": {
    "watchFile": "priorityPollingInterval", // ファイル監視方法
    "watchDirectory": "dynamicPriorityPolling", // ディレクトリ監視方法
    "excludeDirectories": ["node_modules", "dist"] // 監視から除外するディレクトリ
  }
}
```

### 各設定の詳細説明

#### 1. Type Checking（型チェック）設定

**`strict: true`**

- すべての厳格な型チェックオプションを一括で有効化
- 以下のオプションがすべて有効になる：
  - `noImplicitAny`
  - `strictNullChecks`
  - `strictFunctionTypes`
  - `strictBindCallApply`
  - `strictPropertyInitialization`
  - `noImplicitThis`
  - `alwaysStrict`

**`useUnknownInCatchVariables: true`**

- catch節でキャッチした例外を`unknown`型として扱う
- より安全なエラーハンドリングを強制

```typescript
// Before (useUnknownInCatchVariables: false)
try {
  riskyOperation();
} catch (e) {
  console.log(e.message); // eはany型
}

// After (useUnknownInCatchVariables: true)
try {
  riskyOperation();
} catch (e) {
  if (e instanceof Error) {
    console.log(e.message); // 型チェックが必要
  }
}
```

#### 2. Additional Checks（追加チェック）設定

**`exactOptionalPropertyTypes: true`**

- オプショナルプロパティの厳密な型チェック
- `undefined`を明示的に代入できないようにする

```typescript
interface User {
  name?: string;
}

const user: User = {
  name: undefined, // エラー: exactOptionalPropertyTypes: true
};
```

**`noUncheckedIndexedAccess: true`**

- 配列やオブジェクトのインデックスアクセスの結果を`T | undefined`として扱う
- 実行時エラーを防ぐ最重要設定の一つ

```typescript
const arr = [1, 2, 3];
const value = arr[10]; // number | undefined
if (value !== undefined) {
  console.log(value + 1); // 安全
}
```

**`noPropertyAccessFromIndexSignature: true`**

- インデックスシグネチャからのドット記法アクセスを禁止
- より明示的なコードを強制

```typescript
interface Config {
  [key: string]: string;
}

const config: Config = { apiUrl: 'https://api.example.com' };
// config.apiUrl; // エラー
const apiUrl = config['apiUrl']; // OK
```

#### 3. Module Resolution（モジュール解決）設定

**`moduleResolution: "bundler"`**

- 最新のバンドラー（webpack、Vite等）に最適化されたモジュール解決
- Node.js風の解決とESモジュールの良いところを組み合わせる

**`isolatedModules: true`**

- 各ファイルを独立したモジュールとして扱う
- トランスパイラ（Babel、SWC等）との互換性を保証

#### 4. Emit（出力）設定

**`noEmit: true`**

- TypeScriptコンパイラによるJavaScript出力を無効化
- バンドラー（webpack、esbuild等）に出力を委ねる

**`importsNotUsedAsValues: "error"`**

- 型のみのインポートを明示的に記述することを強制

```typescript
// エラー: 型のみのインポートを明示化していない
import { User } from './types';

// OK: 型のみのインポートを明示化
import type { User } from './types';
```

#### 5. Path Mapping（パスマッピング）設定

**パスエイリアスの利点**

- 相対パスの複雑さを解消
- リファクタリング時の影響を最小化
- コードの可読性向上

```typescript
// Before
import { Button } from '../../../components/ui/Button';

// After（パスマッピング使用）
import { Button } from '@components/ui/Button';
```

### プロジェクトタイプ別の推奨設定

#### Next.js プロジェクト

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

#### Node.js バックエンドプロジェクト

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "target": "es2022",
    "module": "commonjs",
    "outDir": "./dist",
    "noEmit": false
  }
}
```

#### ライブラリプロジェクト

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "noEmit": false
  }
}
```

---

_この戦略により、実行時エラーを設計時に完全に排除し、予測可能で保守しやすいコードベースを実現します。_
