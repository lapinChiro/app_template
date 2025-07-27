# Requirements Document

## Introduction

サーバレスアプリケーションのテンプレートプロジェクトを作成します。このテンプレートは、フロントエンド（メンバー画面・管理画面）、バックエンドAPI、インフラストラクチャ、開発環境、ユーザー認証・認可機能を含む完全なプロジェクト構成を提供します。開発者が新しいサーバレスアプリケーションを迅速に開始できるよう、ベストプラクティスと型安全性を重視した構成になっています。

## Requirements

### Requirement 1

**User Story:** 開発者として、サーバレスアプリケーションの基盤となるインフラストラクチャを迅速にセットアップしたいので、CDKを使用したIaCテンプレートが必要です。

#### Acceptance Criteria

1. WHEN 開発者がプロジェクト初期化コマンドを実行する THEN システムは非同期Job機能とスケジュールタスク機能の有効化オプションを提供する
2. WHEN 開発者がCDKデプロイコマンドを実行する THEN システムはCloudFront + S3（メンバー画面用・管理画面用）、API Gateway + Lambda（API用・管理画面用）、DynamoDB、ファイルストレージ用S3を自動作成する
3. WHEN 開発者が初期化時に非同期Job機能を有効にした場合 THEN システムは非同期Job実行用Lambdaを含むインフラを作成する
4. WHEN 開発者が初期化時にスケジュールタスク機能を有効にした場合 THEN システムはスケジュールタスク実行用LambdaとEventBridge Scheduleを含むインフラを作成する
5. WHEN CloudFrontにリクエストが来る THEN システムはビヘイビア設定に基づいてメンバー画面と管理画面を適切に振り分ける
6. WHEN Lambdaが実行される THEN システムは設定に応じてAPI用、管理画面用、および有効化された場合は非同期Job実行用、スケジュールタスク実行用として動作する

### Requirement 2

**User Story:** 開発者として、型安全で高品質なコードを書きたいので、厳格なESLintルールとPrettierによる統一されたコードフォーマットが設定されたプロジェクトが必要です。

#### Acceptance Criteria

1. WHEN 開発者がコードを書く THEN ESLintが厳格なルールでTypeScriptの型安全性を強制する
2. WHEN 開発者がコードを保存する THEN Prettierが自動的にコードをフォーマットする
3. WHEN 開発者がビルドを実行する THEN システムはlintエラーがある場合にビルドを失敗させる

### Requirement 3

**User Story:** 開発者として、フロントエンドとバックエンドの両方でNext.jsを使用したいので、適切に設定されたNext.jsプロジェクト構成が必要です。

#### Acceptance Criteria

1. WHEN 開発者がフロントエンドを開発する THEN システムはNext.js、shadcn/ui、Tailwind CSSが設定された環境を提供する
2. WHEN 開発者がバックエンドAPIを開発する THEN システムはNext.jsベースのAPI開発環境を提供する
3. WHEN 開発者がUIコンポーネントを作成する THEN システムはshadcn/uiコンポーネントとTailwind CSSスタイリングを使用できる

### Requirement 4

**User Story:** 開発者として、APIの型安全性とドキュメント生成を自動化したいので、zodスキーマとOpenAPI仕様の自動生成機能が必要です。

#### Acceptance Criteria

1. WHEN 開発者がAPIエンドポイントを定義する THEN システムはzodスキーマを使用してリクエスト・レスポンスの型安全性を保証する
2. WHEN 開発者がAPIを更新する THEN システムはzod/openapiを使用してOpenAPIドキュメントを自動生成する
3. WHEN 開発者がバリデーションを実装する THEN システムはzodスキーマを使用して統一されたバリデーション機能を提供する

### Requirement 5

**User Story:** 開発者として、コードの品質を保証したいので、Jest、React Testing Library、Cypressを使用した包括的なテスト環境が必要です。

#### Acceptance Criteria

1. WHEN 開発者がユニットテストを書く THEN システムはJestとReact Testing Libraryを使用したテスト環境を提供する
2. WHEN 開発者がE2Eテストを書く THEN システムはCypressを使用したテスト環境を提供する
3. WHEN 開発者がテストを実行する THEN システムは全てのテストタイプ（ユニット、統合、E2E）を実行できる

### Requirement 6

**User Story:** 開発者として、コードドキュメントを自動生成したいので、JSDocs/TSDocsを使用したドキュメント生成機能が必要です。

#### Acceptance Criteria

1. WHEN 開発者がコードにドキュメントコメントを書く THEN システムはJSDocs/TSDocsフォーマットを使用する
2. WHEN 開発者がドキュメント生成コマンドを実行する THEN システムはコードコメントから自動的にドキュメントを生成する
3. WHEN APIドキュメントが更新される THEN システムは最新のスキーマ情報を反映したドキュメントを生成する

### Requirement 7

**User Story:** エンドユーザーとして、Googleアカウントでログインしたいので、Google認証機能が実装されたユーザー管理システムが必要です。

#### Acceptance Criteria

1. WHEN ユーザーがログインボタンをクリックする THEN システムはGoogle OAuth認証フローを開始する
2. WHEN ユーザーがGoogle認証を完了する THEN システムはユーザー情報をDynamoDBに保存し、JWTトークンを発行する
3. WHEN ユーザーが認証が必要なページにアクセスする THEN システムは有効なトークンを確認してアクセスを許可または拒否する

### Requirement 8

**User Story:** 管理者として、ユーザーの作成・読み取り・更新・削除を行いたいので、管理画面でのユーザーCRUD機能が必要です。

#### Acceptance Criteria

1. WHEN 管理者が管理画面にアクセスする THEN システムはユーザー一覧を表示する
2. WHEN 管理者がユーザーを作成・更新・削除する THEN システムはDynamoDBのユーザーデータを適切に操作する
3. WHEN 管理者がユーザー操作を実行する THEN システムは操作結果を管理画面に反映し、適切なフィードバックを提供する

### Requirement 9

**User Story:** 開発者として、プロジェクトを迅速に開始したいので、全ての設定とサンプル実装が含まれたテンプレートプロジェクトが必要です。

#### Acceptance Criteria

1. WHEN 開発者がテンプレートプロジェクトをクローンする THEN システムは即座に開発を開始できる完全な環境を提供する
2. WHEN 開発者がプロジェクト初期化コマンドを実行する THEN システムは非同期Jobとスケジュールタスクのオプション選択を求め、選択に基づいてプロジェクト構成を生成する
3. WHEN 開発者が初期セットアップを実行する THEN システムは依存関係のインストール、環境設定、初期デプロイを自動化する
4. WHEN 開発者がサンプル機能を確認する THEN システムはユーザー認証とCRUD機能の動作例を提供する

### Requirement 10

**User Story:** 開発者として、一貫した開発環境で作業したいので、Dockerを使用した仮想化された開発環境が必要です。

#### Acceptance Criteria

1. WHEN 開発者がdocker compose upコマンドを実行する THEN システムは全てのアプリケーションとサービスをコンテナで起動する
2. WHEN 開発者がオプション機能を有効にする THEN システムはprofilesを使用して必要なサービスのみを起動する
3. WHEN 開発者がコードを変更する THEN システムはホットリロードでリアルタイムに変更を反映する
4. WHEN 開発者が異なる環境で作業する THEN システムは同一のDocker環境で一貫した動作を保証する
