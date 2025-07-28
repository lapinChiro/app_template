# TASK-001: Project Structure Setup

**Priority**: Critical  
**Estimated**: 1 hour  
**Dependencies**: None

## Prerequisites

- Node.js 22.x installed (`node --version` で確認)
- pnpm 8.x installed (`pnpm --version` で確認)
- Git configured
- VS Code または対応エディタ

## Reference Implementation

- Primary: `@docs/impl/workflow/project-init.md` - Section 2: Directory Structure
- Related: `@docs/impl/type-safety/prettier-integration.md` - Prettier設定

## Acceptance Criteria

- [ ] `pnpm-workspace.yaml` が project-init.md Section 2 の仕様通りに設定されている
- [ ] 全ディレクトリ構造が作成され、適切な .gitkeep ファイルが配置されている
- [ ] `.gitignore` に node_modules, dist, .env* が含まれている
- [ ] `.prettierrc` が prettier-integration.md の設定と一致している
- [ ] `pnpm install` がエラーなく完了する
- [ ] Git リポジトリが初期化されている

## Detailed Steps

```bash
# 1. pnpm workspace の初期化
pnpm init
echo 'packages:\n  - "apps/*"\n  - "packages/*"' > pnpm-workspace.yaml

# 2. ディレクトリ構造の作成 (project-init.md Section 2 に基づく)
mkdir -p apps/{web-member,web-admin,api-member,api-admin}
mkdir -p packages/{shared,ui,infra}
mkdir -p docs/{api,architecture,deployment}
touch apps/{web-member,web-admin,api-member,api-admin}/.gitkeep

# 3. 設定ファイルの作成
cp @docs/impl/type-safety/prettier-integration.md#prettierrc .prettierrc
echo 'root = true\n[*]\nindent_style = space\nindent_size = 2' > .editorconfig
```

## Quality Gates

- ESLint errors: N/A (まだ設定前)
- File structure: 100% 一致 with project-init.md
- Configuration files: Valid JSON/YAML syntax

## Verification Steps

```bash
# ディレクトリ構造の確認
find . -type d -name 'node_modules' -prune -o -type d -print | sort

# pnpm workspace の動作確認
pnpm install
pnpm ls --depth=-1

# Git 状態の確認
git status
```

## Output

- 完全なモノレポディレクトリ構造（project-init.md Section 2 準拠）
- 動作する pnpm workspace 設定
- Prettier/EditorConfig による統一フォーマット環境

## Progress

- [ ] Started
- [ ] Implementation complete
- [ ] Verified
- [ ] Documented