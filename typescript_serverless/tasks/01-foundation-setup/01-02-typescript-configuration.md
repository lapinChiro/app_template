# TASK-002: TypeScript Configuration

**Priority**: Critical  
**Estimated**: 2 hours  
**Dependencies**: TASK-001 (完了済みであること)

## Prerequisites

- TASK-001 完了（ディレクトリ構造）
- TypeScript 5.x の基本知識
- モノレポでの TypeScript 設定経験（推奨）

## Reference Implementation

- Primary: `@docs/impl/type-safety/eslint-strategy.md` - TypeScript設定要件
- Related: `@design.md` - Ultimate Type Safety セクション

## Acceptance Criteria

- [ ] ルート `tsconfig.json` で strict: true, strictNullChecks: true が設定されている
- [ ] `noImplicitAny: true` により any 型の暗黙的使用が禁止されている
- [ ] 各パッケージが独自の tsconfig.json を持ち、ルート設定を継承している
- [ ] パスエイリアス（@shared, @ui 等）が全パッケージで動作する
- [ ] `tsc --noEmit` がエラーなく完了する
- [ ] VS Code が型定義を正しく認識する

## Detailed Steps

```json
// 1. ルート tsconfig.json (eslint-strategy.md の要件に基づく)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowJs": false,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "incremental": true,
    "paths": {
      "@shared/*": ["packages/shared/src/*"],
      "@ui/*": ["packages/ui/src/*"]
    }
  },
  "references": [
    { "path": "./packages/shared" },
    { "path": "./packages/ui" },
    { "path": "./packages/infra" },
    { "path": "./apps/web-member" },
    { "path": "./apps/web-admin" },
    { "path": "./apps/api-member" },
    { "path": "./apps/api-admin" }
  ]
}
```

## Quality Gates

- TypeScript errors: 0
- Implicit any usage: 0
- Type coverage: 100%
- Build time: < 30 seconds

## Verification Steps

```bash
# TypeScript コンパイルチェック
pnpm tsc --noEmit

# 各パッケージでの型チェック
pnpm -r exec tsc --noEmit

# パスエイリアスの動作確認
echo 'import { test } from "@shared/test"' > test-import.ts
pnpm tsc test-import.ts --noEmit
rm test-import.ts
```

## Output

- Ultimate Type Safety を実現する TypeScript 設定
- any 型の使用を完全に排除する環境
- 高速なインクリメンタルビルド

## Progress

- [ ] Started
- [ ] Implementation complete
- [ ] Verified
- [ ] Documented