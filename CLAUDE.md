# pw-asist プロジェクト概要

PWのシフト・ローテーション管理システム。

## アーキテクチャ

| 要素 | 技術 | URL |
|------|------|-----|
| フロントエンド | Vue 3 + Vite → Cloudflare Pages | https://pw-asist-frontend.pages.dev |
| バックエンド | Hono → Cloudflare Workers | `pw-asist-backend.workers.dev` |
| DB | Cloudflare D1 (SQLite) | database_id: `5f8cd3bd-7116-4691-b900-716aa963b877` |

Bun Workspaces の Monorepo。`apps/backend` と `apps/frontend` が独立したパッケージ。

## ディレクトリ構成

```
apps/
  backend/
    src/
      worker.ts          # Cloudflare Workers エントリポイント
      index.ts           # ローカル開発用エントリポイント
      app.ts             # Hono アプリ + ルート登録 + CORS
      auth.ts            # JWT生成・検証、authMiddleware、adminMiddleware
      seed.ts            # 開発用シードデータ
      db/
        schema.ts        # Drizzle ORM スキーマ（6テーブル）
        create.ts        # ローカル開発用テーブル作成SQL
        index.ts         # DBシングルトン（setDb/db）
      services/          # ビジネスロジック層
        AuthService.ts
        UserService.ts
        SpotService.ts
        ScheduleService.ts
        RotationService.ts
        ThemeService.ts
        VacationService.ts
      routes/            # APIルート
        users.ts
        spots.ts
        schedules.ts
        rotations.ts
        themes.ts
        vacations.ts
      __tests__/         # サービス単体テスト
    migrations/
      0000_initial.sql   # 初期スキーマ
      0001_vacation_requests.sql  # 休み申請テーブル
    wrangler.toml
  frontend/
    src/
      main.ts
      App.vue            # ルートコンポーネント（ページルーティング）
      pages/             # 8ページ（下記参照）
      components/        # ページ別コンポーネント（user/spot/schedule/rotation/theme/profile）
      store/
        auth.ts          # 認証状態（localStorage永続化、JWT）
        nav.ts           # currentView + URLハッシュ同期
      composables/
        useApi.ts        # API URL + authHeaders()
      constants/
        gender.ts        # Gender.MALE/FEMALE, GenderLabel（兄弟/姉妹）
      utils/
        linkify.ts       # HTMLエスケープ + URL自動リンク化
```

## データベーススキーマ（Drizzle ORM）

```
users              id, email, name, password_hash, is_admin, gender(male/female), created_at
spots              id, name, address, description, created_at
schedules          id, date, spot_id, user_id, is_lead, note, created_at
rotations          id, date, spot_id, starts_at, ends_at, interval_minutes, user_order(JSON), created_at
rotation_slots     id, rotation_id, slot_index, user_id, duty(service/watching/break)
themes             id, week_start, title, body, created_at
vacation_requests  id, user_id, date, comment, created_at  ※ UNIQUE(user_id, date)
```

## APIエンドポイント一覧

**認証**
```
POST /api/login              ログイン
GET  /api/me                 現在のユーザー取得
PUT  /api/me/password        パスワード変更
```

**ユーザー管理（admin only）**
```
GET    /api/users            一覧
POST   /api/users            作成
POST   /api/users/bulk       CSV一括作成
PUT    /api/users/:id        更新
DELETE /api/users/:id        削除
```

**スポット**
```
GET    /api/spots            一覧
POST   /api/spots            作成
DELETE /api/spots/:id        削除（admin only）
```

**スケジュール**
```
GET    /api/schedules/dates?year=&month=   指定月のスケジュール日付
GET    /api/schedules                      全件（admin: 全件、user: 自分+担当スポット）
POST   /api/schedules                      作成/更新（admin only）
DELETE /api/schedules/:id                  削除（admin only）
```

**ローテーション**
```
GET    /api/rotations?date=&spotId=   取得（admin or 責任者のみ編集可）
POST   /api/rotations                 作成/更新
DELETE /api/rotations/:id             削除
GET    /api/my-rotations              自分のローテーション
```

**テーマ**
```
GET    /api/themes/current   現週のテーマ
GET    /api/themes           全件（admin only）
POST   /api/themes           作成/更新（admin only）
DELETE /api/themes/:id       削除（admin only）
```

**休み申請**
```
GET    /api/vacations/my          自分の申請一覧（ログイン済み）
POST   /api/vacations             申請作成/更新（同日はupsert）
DELETE /api/vacations/:id         申請取消（本人 or admin）
GET    /api/vacations?month=      月別全申請（admin only）
GET    /api/vacations/date?date=  日付別全申請（admin only、配置調整画面用）
```

## フロントエンド ページ一覧

| ページ | ファイル | 対象 | 説明 |
|--------|----------|------|------|
| ダッシュボード | Dashboard.vue | 全員 | 当週担当スポット + テーマ表示 |
| ユーザー管理 | UserManagement.vue | admin | CRUD + CSV一括インポート |
| スポット管理 | SpotManagement.vue | 全員 | スポットCRUD |
| スケジュール管理 | ScheduleManagement.vue | admin | カレンダー概要 / 配置調整テーブル（2タブ） |
| ローテーション管理 | RotationManagement.vue | admin + 責任者 | 時間×ユーザーのグリッド編集 |
| テーマ管理 | ThemeManagement.vue | admin | 週テーマCRUD |
| 休み申請 | VacationRequest.vue | 全員 | 休み希望の申請フォーム + 自分の申請履歴 |
| プロフィール | Profile.vue | 全員 | アカウント情報 + パスワード変更 |
| ログイン | Login.vue | 未認証 | メール + パスワード認証 |

## 認証・権限

**方式**: JWT (HS256, 24h)、localStorage に保存

| ロール | 権限 |
|--------|------|
| Anonymous | ログイン画面のみ |
| User | Dashboard, Profile, VacationRequest, 自分のスケジュール/ローテーション閲覧 |
| Admin | 全機能（UserManagement, ThemeManagement, ScheduleManagement配置調整含む） |
| Lead（責任者） | 担当スポットのローテーション編集可 |

## 技術スタック

**Backend**: Hono, Drizzle ORM, bcryptjs, Bun（ローカル）/ Cloudflare Workers（本番）
**Frontend**: Vue 3, Vite, Tailwind CSS v4, vue-draggable-plus（ドラッグドロップ）

## 開発コマンド

```bash
# 開発サーバー起動（monorepo root）
bun run dev:backend     # localhost:3000
bun run dev:frontend    # localhost:5173

# Docker で起動
make up
make down
make logs

# D1マイグレーション（スキーマ変更時）
cd apps/backend
bun run d1:migrate:local   # ローカル
bun run d1:migrate         # 本番
```

## デプロイ手順

### フロントエンド（Cloudflare Pages）

```bash
cd apps/frontend
bun run build
npx wrangler pages deploy dist --project-name pw-asist-frontend --branch production
```

### バックエンド（Cloudflare Workers）

```bash
cd apps/backend
npx wrangler deploy
```

### DBマイグレーション（スキーマ変更時のみ）

```bash
cd apps/backend
npx wrangler d1 migrations apply pw-asist
```

## 環境変数

**Backend**
- `JWT_SECRET`: `wrangler secret put JWT_SECRET` で設定（CLIのみ、tomlに書かない）
- `CORS_ORIGIN`: wrangler.toml の `[vars]` に記載（複数URL カンマ区切り）
- `DB`: D1バインディング（wrangler.tomlで定義）

**Frontend**
- `VITE_API_URL`: APIのベースURL（未設定時は `http://localhost:3000`）

## 開発シードデータ

`apps/backend/src/seed.ts`（`bun run dev` で自動実行）
- Admin: `admin@example.com` / `admin123`
- スポットA〜F
- 複数ダミーユーザー

## 機能追加時の手順

1. **DBにカラム・テーブルを追加する場合**
   - `db/schema.ts` を更新
   - `migrations/` に新しいSQLファイルを追加
   - `d1:migrate` を実行

2. **APIエンドポイントを追加する場合**
   - `services/` に対応するServiceメソッドを追加
   - `routes/` の対応ファイルにルートを追加
   - `app.ts` でルートが登録されているか確認

3. **フロントエンドにページを追加する場合**
   - `pages/` に新しい Vue ファイルを作成
   - `App.vue` にルーティングを追加
   - `Sidebar.vue` にナビゲーションリンクを追加
   - 権限が必要な場合は `store/auth.ts` の `isAdmin` で制御

4. **権限が絡む実装**
   - Backend: `authMiddleware`（認証必須）、`adminMiddleware`（admin必須）を route に適用
   - Frontend: `auth.state.isAdmin` で表示制御
