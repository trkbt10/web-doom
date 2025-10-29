# Web-DOOM モノレポ開発ガイド

このプロジェクトは **Bun** をパッケージマネージャーとして使用するモノレポ構成です。

## パッケージマネージャー

**必ず Bun を使用してください。**

- パッケージマネージャー: `bun`
- インストール: `bun install`
- ビルド: `bun run build`
- テスト: `bun run test`

## プロジェクト構造

このモノレポは以下のパッケージで構成されています：

```
packages/
├── wad/          # @web-doom/wad - WAD ファイルエンコーダー/デコーダー
├── web-doom/     # @web-doom/core - DOOM エンジン実装
├── wad-viewer/   # @web-doom/wad-viewer - WAD ファイルビューアー
└── pages/        # @web-doom/pages - GitHub Pages（プレビューページ）
```

## 依存関係ツリー

```
@web-doom/wad (基礎パッケージ)
├── @web-doom/core
├── @web-doom/wad-viewer
└── @web-doom/pages (すべてに依存)
```

## ビルド順序

依存関係に基づき、以下の順序でビルドする必要があります：

1. `@web-doom/wad`
2. `@web-doom/core` と `@web-doom/wad-viewer` (並行可能)
3. `@web-doom/pages`

ルートから `bun run build` を実行すると、この順序で自動的にビルドされます。

## よく使うコマンド

```bash
# 依存関係のインストール
bun install

# すべてのパッケージをビルド
bun run build

# ライブラリパッケージのみビルド
bun run build:libs

# Pages のみビルド
bun run build:pages

# 型チェック
bun run typecheck

# テスト実行
bun run test

# クリーンアップ
bun run clean
```

## 特定のパッケージに対するコマンド

```bash
# 特定のパッケージでコマンドを実行
bun run --filter @web-doom/wad build
bun run --filter @web-doom/pages dev
```

## TypeScript 設定

このプロジェクトは TypeScript の Composite プロジェクトを使用しています：

- `tsconfig.base.json`: 共通設定
- 各パッケージの `tsconfig.json`: パッケージ固有の設定と依存関係の参照

## 注意事項

- **npm や pnpm は使用しないでください**
- workspace プロトコル (`workspace:*`) を使用して内部パッケージを参照しています
- ビルド前に必ず `bun install` を実行してください
