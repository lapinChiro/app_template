# Prettier + ESLint Integration Strategy

## Overview

ESLintとPrettierの完全統合による自動コードフォーマットシステム。チーム全体で統一されたコードスタイルを強制し、開発者がビジネスロジックに集中できる環境を構築します。

## Configuration Strategy

### Prettier Configuration

```json
{
  "// .prettierrc.json": "Prettierメイン設定",
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "quoteProps": "as-needed",
  "jsxSingleQuote": true,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "embeddedLanguageFormatting": "auto",
  "proseWrap": "preserve",
  "htmlWhitespaceSensitivity": "css"
}
```

### ESLint + Prettier Integration

```javascript
// .eslintrc.js (updated)
module.exports = {
  root: true,
  env: {
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    '@typescript-eslint/strict',
    'plugin:import/recommended',
    'plugin:import/typescript',
    // Prettier統合 - 必ず最後に配置
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './apps/*/tsconfig.json', './packages/*/tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'import', 'tsdoc'],
  rules: {
    // TypeScript - 型安全性の最大化
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    '@typescript-eslint/no-unsafe-argument': 'error',

    // 関数の厳格化
    '@typescript-eslint/explicit-function-return-type': [
      'error',
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
        allowDirectConstAssertionInArrowFunctions: true,
      },
    ],
    '@typescript-eslint/explicit-module-boundary-types': 'error',

    // 未使用変数の厳格化
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],

    // null/undefined チェックの強化
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/strict-boolean-expressions': [
      'error',
      {
        allowNullableBoolean: true,
        allowNullableObject: true,
        allowNumber: false,
        allowString: false,
        allowNullableString: false,
        allowNullableNumber: false,
      },
    ],

    // Promise/async の厳格化
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/require-await': 'error',

    // TSDoc ドキュメンテーション
    'tsdoc/syntax': 'error',

    // Import/Export の管理
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import/no-duplicates': 'error',
    'import/no-cycle': 'error',
    'import/no-self-import': 'error',

    // ES6+の基本
    'prefer-const': 'error',
    'no-var': 'error',
    'prefer-template': 'error',
    'object-shorthand': ['error', 'always'],

    // エラー処理
    'no-throw-literal': 'error',
    '@typescript-eslint/only-throw-error': 'error',

    // デバッグコードの禁止
    'no-console': 'error',
    'no-debugger': 'error',

    // コードの複雑さ制限
    complexity: ['error', 15],
    'max-depth': ['error', 4],
    'max-lines': [
      'error',
      {
        max: 200,
        skipBlankLines: true,
        skipComments: true,
      },
    ],
    'max-lines-per-function': [
      'error',
      {
        max: 75,
        skipBlankLines: true,
        skipComments: true,
      },
    ],

    // その他の品質向上
    eqeqeq: ['error', 'always'],
    'no-duplicate-imports': 'off', // import/no-duplicates を使用

    // Prettier競合ルールの無効化（prettierプリセットで自動処理）
    // 手動で無効化する必要はないが、明示的に記載
    'max-len': 'off',
    quotes: 'off',
    semi: 'off',
    '@typescript-eslint/semi': 'off',
    '@typescript-eslint/quotes': 'off',
    '@typescript-eslint/comma-dangle': 'off',
    '@typescript-eslint/indent': 'off',
  },
  settings: {
    'import/resolver': {
      typescript: true,
    },
  },
  overrides: [
    {
      // テストファイルの共通設定
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        'no-console': 'off',
        'max-lines-per-function': 'off',
        'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],
        complexity: 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules',
    'dist',
    '.next',
    'out',
    'coverage',
    '.eslintrc.js',
    '*.config.{js,ts}',
    'jest.config.js',
    'vitest.config.ts',
    'cypress.config.ts',
  ],
};
```

### Prettier Ignore Configuration

```gitignore
# .prettierignore
node_modules
dist
.next
out
coverage
*.min.js
*.min.css

# Generated files
public/static
docs/api-docs

# Config files that should maintain specific formatting
.eslintrc.js
jest.config.js
next.config.js
tailwind.config.js

# Lock files
package-lock.json
yarn.lock
pnpm-lock.yaml

# Logs
*.log

# Environment files
.env*
```

## Editor Integration

### VS Code Configuration

```json
{
  "// .vscode/settings.json": "プロジェクト統一VS Code設定",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"],
  "typescript.preferences.organizeImportsOnSave": true,
  "typescript.suggest.autoImports": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[jsonc]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[markdown]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### Required VS Code Extensions

```json
{
  "// .vscode/extensions.json": "推奨拡張機能",
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

## Git Hooks Integration

### Husky Setup

```json
{
  "// package.json scripts section": "",
  "scripts": {
    "prepare": "husky install",
    "lint": "eslint . --ext .ts,.tsx,.js,.jsx --max-warnings 0",
    "lint:fix": "eslint . --ext .ts,.tsx,.js,.jsx --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "type-check": "tsc --noEmit",
    "quality:check": "npm run type-check && npm run lint && npm run format:check"
  },
  "devDependencies": {
    "husky": "^8.0.3",
    "lint-staged": "^13.2.3",
    "prettier": "^3.0.0",
    "eslint-config-prettier": "^9.0.0"
  }
}
```

### Pre-commit Hook

```bash
#!/usr/bin/env sh
# .husky/pre-commit

. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged for staged files
npx lint-staged

# Type check entire project
npm run type-check
```

### Lint-staged Configuration

```json
{
  "// package.json": "",
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yaml,yml}": ["prettier --write"],
    "*.{css,scss}": ["prettier --write"]
  }
}
```

### Pre-push Hook

```bash
#!/usr/bin/env sh
# .husky/pre-push

. "$(dirname -- "$0")/_/husky.sh"

# Full quality check before push
echo "🔍 Running quality checks before push..."

# Type check
echo "📋 Type checking..."
npm run type-check

# Lint check
echo "🔍 Linting..."
npm run lint

# Format check
echo "🎨 Format checking..."
npm run format:check

# Unit tests
echo "🧪 Running unit tests..."
npm run test:unit

echo "✅ All quality checks passed!"
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/code-quality.yml
name: Code Quality

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  quality:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: ESLint check
        run: npm run lint -- --max-warnings=0

      - name: Prettier check
        run: npm run format:check

      - name: Run tests
        run: npm run test:unit -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

## Member/Admin Consistent Formatting

### Shared Prettier Scripts

```json
{
  "// packages/shared/package.json": "",
  "scripts": {
    "format": "prettier --write src/**/*.{ts,tsx}",
    "format:check": "prettier --check src/**/*.{ts,tsx}"
  }
}
```

### App-specific Formatting

```json
{
  "// apps/member/package.json": "",
  "scripts": {
    "format": "prettier --write src/**/*.{ts,tsx} --config ../../.prettierrc.json",
    "format:check": "prettier --check src/**/*.{ts,tsx} --config ../../.prettierrc.json"
  }
}
```

```json
{
  "// apps/admin/package.json": "",
  "scripts": {
    "format": "prettier --write src/**/*.{ts,tsx} --config ../../.prettierrc.json",
    "format:check": "prettier --check src/**/*.{ts,tsx} --config ../../.prettierrc.json"
  }
}
```

## Formatting Examples

### Before Prettier (Inconsistent)

```typescript
// ❌ 不統一なフォーマット
export const createUser = async (userData: {
  name: string;
  email: string;
  role: 'member' | 'admin';
}) => {
  const user = {
    id: generateId(),
    ...userData,
    createdAt: new Date().toISOString(),
  };
  return await userRepository.create(user);
};
```

### After Prettier (Consistent)

```typescript
// ✅ 統一されたフォーマット
export const createUser = async (userData: {
  name: string;
  email: string;
  role: 'member' | 'admin';
}) => {
  const user = {
    id: generateId(),
    ...userData,
    createdAt: new Date().toISOString(),
  };

  return await userRepository.create(user);
};
```

### Complex Type Formatting

```typescript
// ✅ 複雑な型定義の自動フォーマット
export interface UserManagementProps {
  users: User[];
  onCreateUser: (userData: CreateUserInput) => Promise<void>;
  onUpdateUser: (id: string, userData: UpdateUserInput) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

// ✅ 長い関数チェーンの自動改行
const processedUsers = users
  .filter(user => user.isActive)
  .map(user => ({
    ...user,
    displayName: `${user.name} (${user.role})`,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));
```

## Benefits

### 1. Zero Configuration Conflicts

- **ESLint + Prettier**: 完全な統合、競合ルールなし
- **Editor Agnostic**: VS Code、WebStorm、Vim等で統一体験
- **Team Harmony**: フォーマットに関する議論を完全排除

### 2. Automatic Quality Enforcement

- **Save-time Formatting**: 保存時の自動フォーマット
- **Pre-commit Validation**: コミット前の必須品質チェック
- **CI/CD Integration**: プルリクエスト時の自動検証

### 3. Member/Admin Consistency

- **統一スタイル**: 両アプリで完全に統一されたコードスタイル
- **Shared Configuration**: 共通設定による一貫性保証
- **Cross-team Collaboration**: チーム間でのスムーズなコードレビュー

### 4. Developer Productivity

- **Focus on Logic**: フォーマットではなくビジネスロジックに集中
- **Instant Feedback**: リアルタイムのフォーマット・lint警告
- **Reduced Cognitive Load**: フォーマット決定の認知負荷排除

## Troubleshooting

### Common Issues

```bash
# ESLint + Prettier 競合の解決
npm install --save-dev eslint-config-prettier

# VS Code フォーマットが効かない場合
# 1. 拡張機能の再インストール
# 2. VS Code設定の確認
# 3. workspace設定の優先順位確認

# Git hooks が動作しない場合
npx husky install
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
```

### Performance Optimization

```bash
# 大きなファイルのフォーマット除外
echo "**/*.generated.ts" >> .prettierignore

# ESLint + Prettier の並列実行
npm install --save-dev npm-run-all
npm run lint && npm run format:check
# ↓
npm-run-all --parallel lint format:check
```

---

_この統合戦略により、チーム全体で完全に統一されたコードスタイルを自動的に維持し、開発者がビジネスロジックに集中できる環境を実現します。_
