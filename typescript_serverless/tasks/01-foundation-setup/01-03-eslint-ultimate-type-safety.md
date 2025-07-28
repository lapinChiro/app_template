# TASK-003: ESLint Ultimate Type Safety Setup

**Priority**: Critical  
**Estimated**: 3 hours  
**Dependencies**: TASK-002 (TypeScript設定完了)

## Prerequisites

- TASK-002 完了（TypeScript設定）
- ESLint と TypeScript ESLint の理解
- VS Code installed

## Reference Implementation

- Primary: `@docs/impl/type-safety/eslint-strategy.md` - 8レベル型安全性の完全実装
- Secondary: `@docs/impl/type-safety/prettier-integration.md` - Prettier統合
- Related: `@eslint.config.js` - 実際の設定ファイル

## Acceptance Criteria

- [ ] 8レベル型安全性アーキテクチャが完全に実装されている
- [ ] `@typescript-eslint/no-explicit-any: 'error'` により any 型が完全禁止
- [ ] 関数の最大行数が 100 行に制限されている（Claude Code最適化）
- [ ] Prettier と ESLint の競合がない
- [ ] pre-commit hook で自動チェックが動作する
- [ ] `pnpm lint` がエラー 0、警告 0 で完了する

## Detailed Implementation

```javascript
// .eslintrc.js - eslint-strategy.md の8レベル実装
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  rules: {
    // Level 1: Complete any Elimination
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    
    // Level 2: Function Boundary Safety (Claude最適化済み)
    '@typescript-eslint/explicit-module-boundary-types': 'error',
    
    // Level 3: Null/Undefined Complete Safety
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    
    // Level 4: Promise/Async Complete Safety
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/require-await': 'error',
    
    // Level 5: Code Quality Gates (Claude最適化済み)
    'complexity': ['error', 15],
    'max-lines-per-function': ['error', { max: 100 }],
    'max-lines': ['error', { max: 300 }],
    'no-console': 'error',
    
    // Level 6: Exhaustiveness (Claude特有の強み)
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
    
    // Level 7: Dependency Management
    'import/order': ['error', {
      'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'always',
      'alphabetize': { 'order': 'asc' }
    }],
    'import/no-cycle': 'error',
    'import/no-duplicates': 'error'
  }
};
```

## Pre-commit Hook Setup

```bash
# Husky + lint-staged インストール
pnpm add -D husky lint-staged
pnpm husky install

# pre-commit hook 設定
pnpm husky add .husky/pre-commit "pnpm lint-staged"
```

## Quality Gates

- ESLint errors: 0
- ESLint warnings: 0
- Any type usage: 0 instances
- Pre-commit hook: 100% 実行率

## Verification Steps

```bash
# ESLint 動作確認
pnpm lint

# 個別ルールのテスト
echo 'const test: any = 1;' > test.ts
pnpm eslint test.ts # エラーが出ることを確認
rm test.ts

# pre-commit hook テスト
git add .
git commit -m "test" # ESLint が自動実行されることを確認
```

## Output

- 8レベル型安全性を強制する ESLint 設定
- Claude Code に最適化された実用的なルール
- 自動化された品質保証環境

## Progress

- [ ] Started
- [ ] Implementation complete
- [ ] Verified
- [ ] Documented