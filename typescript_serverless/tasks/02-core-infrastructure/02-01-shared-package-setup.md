# TASK-005: Shared Package Setup

**Priority**: High  
**Estimated**: 2 hours  
**Dependencies**: TASK-002 (pnpm Workspace)

## Prerequisites

- pnpm workspace の理解
- TypeScript の基本知識
- モノレポ構造の理解

## Reference Implementation

- Primary: `@docs/impl/api/zod-schemas.md` - パッケージ構造の参考
- Secondary: `@docs/impl/type-safety/eslint-strategy.md` - 型安全性

## Acceptance Criteria

- [ ] packages/shared が pnpm workspace に追加されている
- [ ] TypeScript 設定が完了している
- [ ] 基本的なユーティリティ関数が実装されている
- [ ] 型定義ファイルが作成されている
- [ ] エクスポート設定が正しく行われている
- [ ] 他のパッケージから import できる

## Detailed Implementation

### Package Setup
```json
// packages/shared/package.json
{
  "name": "@shared/core",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./utils": {
      "types": "./dist/utils/index.d.ts",
      "import": "./dist/utils/index.js"
    },
    "./types": {
      "types": "./dist/types/index.d.ts",
      "import": "./dist/types/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest",
    "lint": "eslint src --ext .ts"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.6.0",
    "vitest": "^2.0.0"
  }
}
```

### TypeScript Configuration
```json
// packages/shared/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "composite": true
  },
  "include": ["src/**/*"],
  "exclude": ["**/*.test.ts", "**/*.spec.ts"]
}
```

### Basic Utilities
```typescript
// packages/shared/src/utils/date.ts
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const parseDate = (dateString: string): Date => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date string');
  }
  return date;
};

// packages/shared/src/utils/string.ts
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const truncate = (str: string, length: number): string => {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
};
```

### Type Definitions
```typescript
// packages/shared/src/types/common.ts
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

// packages/shared/src/types/api.ts
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
```

### Export Configuration
```typescript
// packages/shared/src/index.ts
export * from './utils';
export * from './types';

// packages/shared/src/utils/index.ts
export * from './date';
export * from './string';

// packages/shared/src/types/index.ts
export * from './common';
export * from './api';
```

## Quality Gates

- TypeScript errors: 0
- ESLint errors: 0
- Test coverage: > 90%
- Bundle size: < 10KB

## Verification Steps

```bash
# ビルド
cd packages/shared
pnpm build

# 型チェック
pnpm tsc --noEmit

# テスト実行
pnpm test

# 他パッケージからのインポート確認
cd ../../apps/web-member
pnpm add @shared/core@workspace:*

# テストファイルでインポート確認
echo "import { formatDate } from '@shared/core/utils';" > test-import.ts
pnpm tsc test-import.ts --noEmit
rm test-import.ts
```

## Output

- 再利用可能な共有ライブラリパッケージ
- 型安全なユーティリティ関数群
- 明確なエクスポート構造

## Progress

- [ ] Started
- [ ] Implementation complete
- [ ] Verified
- [ ] Documented