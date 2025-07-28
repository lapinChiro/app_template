# Next.js と TypeScript Monorepo の統合

## 重要な制限事項

Next.jsプロジェクトはTypeScriptプロジェクトリファレンスと**互換性がありません**。

### 理由

1. **Next.js**
   - 独自のビルドシステム（SWC/Babel）を使用
   - `noEmit: true` が必須
   - TypeScriptは型チェックのみに使用

2. **TypeScript Project References**
   - `composite: true` が必要
   - 出力ファイルの生成が必要（`noEmit: false`）
   - `.d.ts` ファイルの生成が必要

### 推奨される構成

```json
// apps/web-member/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "noEmit": true,  // Next.jsに必須
    // composite: true を設定しない
    // references を使用しない
  }
}
```

### 代替アプローチ

1. **パスエイリアスの使用**
   ```json
   "paths": {
     "@shared/*": ["../../packages/shared/src/*"],
     "@ui/*": ["../../packages/ui/src/*"]
   }
   ```

2. **独立した型チェック**
   - Next.jsアプリは個別に型チェック
   - `npm run typecheck:packages`で各パッケージを個別にチェック

3. **ビルドツールの活用**
   - Turborepo、Nx などのmonorepoツールを使用
   - 依存関係の管理をTypeScriptではなくビルドツールに委譲

## まとめ

Next.jsをTypeScriptプロジェクトリファレンスから除外するのは、アドホックな回避策ではなく、**業界標準のベストプラクティス**です。