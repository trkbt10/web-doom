# DOOM WASM ビルドガイド

このプロジェクトは Cloudflare の doom-wasm を使用しています。

## 前提条件

macOS で Homebrew を使用している場合：

```bash
brew install emscripten
brew install automake
brew install sdl2 sdl2_mixer sdl2_net
```

## ビルド手順

### 1. ビルドスクリプトを実行

```bash
./scripts/build-doom-wasm.sh
```

このスクリプトは：
- doom-wasm リポジトリをクローン
- WebAssembly にコンパイル
- 生成されたファイルを `packages/pages/public/doom/` にコピー

### 2. doom1.wad のダウンロード（初回のみ）

DOOM Shareware WAD ファイルが必要です：

```bash
curl -o build/doom-wasm/src/doom1.wad https://distro.ibiblio.org/slitaz/sources/packages/d/doom1.wad
```

その後、再度ビルドスクリプトを実行：

```bash
./scripts/build-doom-wasm.sh
```

### 3. 動作確認

開発サーバーを起動：

```bash
bun run --filter @web-doom/pages dev
```

ブラウザで `http://localhost:5173/#/doom-player` にアクセス

## ビルド成果物

ビルドが成功すると、以下のファイルが生成されます：

```
packages/pages/public/doom/
├── websockets-doom.js    # メイン JavaScript
├── websockets-doom.wasm  # WebAssembly バイナリ
├── default.cfg           # DOOM 設定ファイル
└── doom1.wad            # DOOM Shareware IWAD
```

## トラブルシューティング

### Emscripten がインストールされていない

```
Error: Emscripten is not installed
```

→ 前提条件のセクションを参照して Emscripten をインストールしてください

### doom1.wad が見つからない

ビルドは成功しますが、ゲームを起動するには WAD ファイルが必要です。
上記の手順2を実行してください。

### Emscripten 4.x の互換性エラー

Emscripten 4.0 以降で以下のエラーが発生する場合：

```
emcc: error: invalid command line setting `-sEXTRA_EXPORTED_RUNTIME_METHODS`: No longer supported, use EXPORTED_RUNTIME_METHODS
```

このエラーは自動的に修正されます。ビルドスクリプトは doom-wasm の `configure.ac` を Emscripten 4.x に対応させるパッチを適用します。

### ビルドエラー

ビルドディレクトリをクリーンアップして再試行：

```bash
rm -rf build/doom-wasm
./scripts/build-doom-wasm.sh
```

## リファレンス

- [doom-wasm GitHub](https://github.com/cloudflare/doom-wasm)
- [Chocolate Doom](https://github.com/chocolate-doom/chocolate-doom)
- [Emscripten](https://emscripten.org/)
