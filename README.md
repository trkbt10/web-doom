# web-doom

TypeScriptで実装されたWebブラウザ上で動作するDOOMエンジンのモノレポプロジェクトです。

## プロジェクト構成

このモノレポは以下のパッケージで構成されています：

- **@web-doom/wad** - WADファイルのエンコーダー/デコーダー
- **@web-doom/core** - DOOMエンジン実装
- **@web-doom/wad-viewer** - WADファイルビューアー
- **@web-doom/pages** - デモ/プレビューページ（GitHub Pages）

## セットアップ

### 1. 依存関係のインストール

```bash
bun install
```

### 2. Git submodulesの同期

```bash
git submodule update --init --recursive
```

### 3. WADファイルの配置（オプション）

DOOMを遊ぶには、WADファイルが必要です。

**方法1: ブラウザからアップロード**
- ビルド後、ブラウザ上から直接WADファイルをアップロードできます

**方法2: プロジェクトに配置**
- WADファイルを `packages/pages/public/wads/` ディレクトリに配置
- 詳細は `packages/pages/public/wads/README.md` を参照

対応するWADファイル：
- DOOM Shareware（DOOM1.WAD）- 無料で入手可能
- DOOM Registered（DOOM.WAD）
- DOOM II（DOOM2.WAD）
- FreeDoom（freedoom1.wad, freedoom2.wad）

### 4. ビルド

```bash
bun run build
```

### 5. 開発サーバーの起動

```bash
bun run --filter @web-doom/pages dev
```

## スクリプト

```bash
# すべてのパッケージをビルド
bun run build

# ライブラリパッケージのみビルド
bun run build:libs

# Pagesのみビルド
bun run build:pages

# 型チェック
bun run typecheck

# テスト実行
bun run test

# クリーンアップ
bun run clean
```

## 技術スタック

- **Package Manager**: Bun
- **Language**: TypeScript
- **Build Tool**: Vite
- **UI Framework**: React (Pages用)
- **Monorepo**: Bun Workspaces
