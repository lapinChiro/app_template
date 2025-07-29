# テストカバレッジ基準

## 概要

プロジェクトの品質を維持するため、段階的なカバレッジ基準を設定しています。

> **⚠️ 重要**: 現在、Huskyプリコミットフックでのエラーを避けるため、vitest.config.tsの設定値は一時的に下げています。  
> 実際の設定値については各vitest.config.tsファイルのコメントを参照してください。  
> 本ドキュメントに記載されている基準値が本来の目標です。

## 現在の基準と実績

### 1. コアロジック (`packages/shared`)
- **現在の実績**: 71.89%
- **Phase 1 目標**: 70% ✅ (達成済み)
- **Phase 2 目標**: 80%
- **理由**: ビジネスロジック、認証、データ処理などの重要な機能

### 2. UIコンポーネント (`packages/ui`)
- **現在の実績**: 46.93%
- **Phase 1 目標**: 40% ✅ (達成済み)
- **Phase 2 目標**: 50%
- **理由**: Storybookでの視覚的テストで補完

### 3. APIアプリケーション (`apps/api-*`)
- **目標**: 70% (実装後)
- **理由**: 統合テストとE2Eテストで補完

## カバレッジの種類

- **Statements**: コードの実行可能な文のカバレッジ
- **Branches**: if/else、switch文などの分岐カバレッジ
- **Functions**: 関数のカバレッジ
- **Lines**: 行カバレッジ

## 例外的なケース

以下のファイルはカバレッジから除外:
- `*.d.ts` - 型定義ファイル
- `*.test.ts` - テストファイル自体
- `*.stories.tsx` - Storybookストーリー
- `index.ts` - エクスポートのみのファイル
- `test/**` - テストユーティリティ

## 段階的アプローチ

### Phase 1 (現在)
```javascript
// packages/shared
statements: 70%, branches: 70%, functions: 70%, lines: 70%

// packages/ui  
statements: 40%, branches: 40%, functions: 20%, lines: 40%
```

### Phase 2 (3ヶ月後)
```javascript
// packages/shared
statements: 80%, branches: 80%, functions: 80%, lines: 80%

// packages/ui
statements: 50%, branches: 50%, functions: 50%, lines: 50%
```

### Phase 3 (6ヶ月後)
```javascript
// packages/shared
statements: 85%, branches: 85%, functions: 85%, lines: 85%

// packages/ui
statements: 60%, branches: 60%, functions: 60%, lines: 60%
```

## カバレッジ改善のヒント

1. **優先順位**
   - クリティカルなビジネスロジック
   - エラーハンドリング
   - エッジケース

2. **テスト戦略**
   - ユニットテスト: 個別の関数・メソッド
   - 統合テスト: モジュール間の連携
   - E2Eテスト: ユーザーシナリオ

3. **UIテストの補完**
   - Storybook: 視覚的回帰テスト
   - スナップショットテスト: UIの構造変更検知
   - アクセシビリティテスト

## コマンド

```bash
# カバレッジレポートを生成
npm run test:coverage

# HTMLレポートを開く
open coverage/index.html

# 特定パッケージのみ
pnpm --filter @shared/core test:coverage
```

## CI/CD統合

GitHub Actionsでカバレッジチェックを自動化:
- PRごとにカバレッジを検証
- カバレッジが低下した場合は警告
- マージ前に基準を満たす必要あり