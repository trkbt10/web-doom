# DOOM Texture Transformer UI

WADファイルのテクスチャ変換を管理するWebアプリケーション。Nanobanana APIを使用してAI変換を行い、変換履歴やテーマごとのプロジェクト管理を提供します。

## 機能

### プロジェクト管理
- 複数のWAD変換プロジェクトを同時管理
- テーマごとにフォルダ分け
- プロジェクトメタデータの永続化

### テクスチャ管理
- WADファイルからテクスチャ自動抽出
- カテゴリ別・セマンティック別グルーピング
- テクスチャのプレビューとグリッド表示
- フィルタリング（全て/変換済み/未変換）

### AI変換
- Nanobanana i2i APIによる画像変換
- パラメータ調整（strength, steps, guidance scale）
- ネガティブプロンプト対応
- 変換履歴の保存
- 過去の変換結果への復元
- 変換確定機能

### データ永続化
- ファイルシステムベースの永続化
- プロジェクトごとのフォルダ構造
- オリジナル画像と変換画像の分離保存
- 変換履歴の完全記録

## アーキテクチャ

```
texture-transformer-ui/
├── server/              # Hono backend (ポート: 8010)
│   ├── index.ts        # サーバーエントリーポイント
│   ├── routes/         # API ルート
│   │   ├── projects.ts  # プロジェクト管理 API
│   │   ├── textures.ts  # テクスチャ管理 API
│   │   └── wads.ts      # WAD情報 API
│   └── services/       # ビジネスロジック
│       ├── project-manager.ts   # プロジェクト/データ管理
│       ├── wad-service.ts       # WAD処理
│       └── transform-service.ts # AI変換処理
├── client/             # React frontend (ポート: 8011)
│   ├── src/
│   │   ├── App.tsx              # メインアプリ
│   │   ├── components/
│   │   │   ├── ProjectList.tsx      # プロジェクト一覧
│   │   │   ├── ProjectView.tsx      # プロジェクト詳細
│   │   │   ├── TextureGrid.tsx      # テクスチャグリッド
│   │   │   ├── TextureDetail.tsx    # テクスチャ編集UI
│   │   │   └── CreateProjectModal.tsx
│   │   └── index.html
│   └── vite.config.ts
└── data/               # 永続化データ (gitignored)
    └── <project-id>/
        ├── metadata.json       # プロジェクトメタデータ
        ├── originals/          # オリジナル画像
        ├── transformed/        # 変換済み画像
        └── textures/           # テクスチャメタデータ
            └── <name>.json
```

## セットアップ

### 1. 依存関係のインストール

```bash
cd packages/texture-transformer-ui
bun install
```

### 2. 環境変数の設定

`.env`ファイルを作成：

```bash
# Nanobanana API key (required for Nanobanana transformations)
NANOBANANA_API_KEY=your_nanobanana_api_key_here

# Optional: Nanobanana endpoint (default: https://api.nanobanana.ai/v1/i2i)
NANOBANANA_ENDPOINT=https://api.nanobanana.ai/v1/i2i

# Gemini API key (required for Gemini transformations)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Server port (default: 8010)
PORT=8010
```

**注意**: NanobananaとGemini、どちらか一方のAPIキーだけでも動作しますが、両方あるとAIバックエンドを自由に切り替えられます。

### 3. サーバーとフロントエンドの起動

2つのターミナルウィンドウで別々に起動：

```bash
# Terminal 1: Backend server
bun run dev:server

# Terminal 2: Frontend dev server
bun run dev
```

または、並行実行：

```bash
# 両方同時起動（concurrentlyを使用）
bun run dev:all  # TODO: package.jsonに追加
```

### 4. アクセス

- **フロントエンド**: http://localhost:8011
- **バックエンドAPI**: http://localhost:8010/api
- **ヘルスチェック**: http://localhost:8010/health

## 使い方

### 1. プロジェクト作成

1. 「+ New Project」ボタンをクリック
2. プロジェクト名を入力（例: "Cyberpunk DOOM"）
3. WADファイルのパスを入力（例: `/path/to/freedoom1.wad`）
4. 説明を入力（オプション）
5. 「Create Project」をクリック

### 2. テクスチャ抽出

1. プロジェクトを開く
2. 「Extract Textures from WAD」ボタンをクリック
3. 自動的にWADからテクスチャが抽出され、カテゴリ別に分類されます

### 3. テクスチャ変換

1. グリッドからテクスチャを選択
2. 変換プロンプトを入力（例: "cyberpunk neon style with glowing effects"）
3. パラメータを調整：
   - **Strength** (0-1): 元画像からの逸脱度
   - **Steps** (10-50): 推論の反復回数
   - **Guidance Scale** (1-20): プロンプトへの従順度
4. 「Transform」ボタンをクリック
5. 結果を確認し、気に入ったら「✓ Confirm」

### 4. 変換履歴の管理

- 各テクスチャの変換履歴が自動保存されます
- 「Transformation History」から過去の結果を確認
- 「Revert to This」で過去の変換結果に戻せます
- 「Reset to Original」で全変換をリセット

### 5. バッチ変換

1. 「🚀 Batch Transform」ボタンをクリック
2. 変換モードを選択：
   - **All Pending Textures**: 全ての未変換テクスチャ
   - **By Category**: カテゴリ別（Sprites, Walls, Flats, etc.）
3. AIバックエンドを選択（Nanobanana or Gemini）
4. プロンプトとパラメータを設定
5. 「Start Batch Transform」をクリック

### 6. エクスポート

1. 「📦 Export」ボタンをクリック
2. エクスポートタイプを選択：
   - **Export WAD**: 変換済みテクスチャを含む新しいWADファイル
   - **Export Project Archive**: プロジェクト全体（画像とメタデータ）
   - **Export Metadata (JSON)**: メタデータのみ

### 7. フィルタリング

- **All**: 全てのテクスチャ
- **Transformed**: 変換済みのみ
- **Pending**: 未変換のみ

### 8. AIバックエンド選択

**Nanobanana (i2i)**:
- スプライトに最適
- 細かいパラメータ調整が可能
- Strength, Steps, Guidance Scale, Seed対応

**Gemini AI**:
- 高速で汎用的
- プロンプトのみで変換
- ウォールテクスチャやフラットに最適

## API エンドポイント

### プロジェクト管理

```
GET    /api/projects          # プロジェクト一覧
POST   /api/projects          # プロジェクト作成
GET    /api/projects/:id      # プロジェクト詳細
PATCH  /api/projects/:id      # プロジェクト更新
DELETE /api/projects/:id      # プロジェクト削除
```

### テクスチャ管理

```
GET  /api/textures/:projectId                    # テクスチャ一覧
GET  /api/textures/:projectId/:textureName       # テクスチャ詳細
POST /api/textures/:projectId/extract            # テクスチャ抽出
POST /api/textures/:projectId/:textureName/transform  # 変換実行
POST /api/textures/:projectId/:textureName/confirm    # 変換確定
POST /api/textures/:projectId/:textureName/revert     # 履歴復元
POST /api/textures/:projectId/:textureName/reset      # リセット
```

### WAD情報

```
POST /api/wads/info      # WADファイル情報取得
POST /api/wads/catalog   # テクスチャカタログ取得
```

### エクスポート & バッチ変換

```
POST /api/export/:projectId/wad              # WADファイルエクスポート
POST /api/export/:projectId/project          # プロジェクトアーカイブエクスポート
POST /api/export/:projectId/json             # メタデータJSONエクスポート
POST /api/export/import                      # プロジェクトインポート
POST /api/export/batch/:projectId            # カスタムバッチ変換
POST /api/export/batch/:projectId/pending    # 未変換テクスチャ一括変換
POST /api/export/batch/:projectId/category/:category  # カテゴリ別バッチ変換
```

## データ構造

### プロジェクトメタデータ (`data/<project-id>/metadata.json`)

```json
{
  "id": "cyberpunk-doom-1234567890",
  "name": "Cyberpunk DOOM",
  "wadFile": "/path/to/freedoom1.wad",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T12:00:00.000Z",
  "textureCount": 2257,
  "transformedCount": 150,
  "description": "Cyberpunk-themed transformation"
}
```

### テクスチャメタデータ (`data/<project-id>/textures/<name>.json`)

```json
{
  "name": "TROOA1",
  "category": "SPRITE",
  "originalBase64": "data:image/png;base64,...",
  "transformedBase64": "data:image/png;base64,...",
  "confirmed": true,
  "transformHistory": [
    {
      "timestamp": "2025-01-01T12:00:00.000Z",
      "prompt": "cyberpunk neon style",
      "strength": 0.75,
      "steps": 30,
      "guidanceScale": 7.5,
      "resultBase64": "data:image/png;base64,..."
    }
  ]
}
```

## 技術スタック

### Backend
- **Runtime**: Bun
- **Framework**: Hono
- **Storage**: File System (fs/promises)
- **WAD Processing**: @web-doom/wad
- **Texture Transformer**: @web-doom/texture-transformer
- **AI Backend**: Nanobanana i2i API

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: CSS (custom)
- **State Management**: React Hooks

## ✅ 全機能実装完了！

### 実装済み機能

- [x] **WAD再コンパイル機能** - `pngFileToPictureLump`を使用した完全実装
- [x] **バッチ変換機能** - 複数テクスチャを一度に変換
  - 全未変換テクスチャ
  - カテゴリ別バッチ変換
  - カスタム選択バッチ変換
- [x] **エクスポート機能**
  - 変換済みWADファイルのエクスポート
  - プロジェクト全体のアーカイブエクスポート
  - メタデータJSON export
- [x] **Gemini AIバックエンド対応** - Nanobananaとの切り替え可能
- [x] **プロジェクトのインポート/エクスポート** - tar.gz形式でのアーカイブ

### 今後の拡張候補

- [ ] テンプレートプロンプト集
- [ ] リアルタイムプログレス表示の改善
- [ ] 変換結果の比較ビュー（Before/After）
- [ ] バッチ変換の並列処理

## トラブルシューティング

### Nanobanana API エラー
- APIキーが正しく設定されているか確認
- API残高を確認
- レート制限に注意

### WAD抽出エラー
- WADファイルのパスが正しいか確認
- ファイルの読み取り権限を確認
- 対応するWADフォーマットか確認（DOOM/Freedoom）

### 画像が表示されない
- ブラウザのコンソールでエラーを確認
- base64エンコードが正しいか確認
- CORS設定を確認

## ライセンス

このプロジェクトは `@web-doom` モノレポの一部です。
