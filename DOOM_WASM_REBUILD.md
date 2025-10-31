# DOOM WASM Rebuild Guide

このガイドでは、メモリ設定を更新したDOOM WebAssemblyモジュールを再ビルドする方法を説明します。

## 問題

DOOM実行中に`RuntimeError: memory access out of bounds`が発生する場合、WebAssemblyモジュールのメモリ不足が原因です。

## 解決方法

メモリ設定を増やしてWASMモジュールを再ビルドします。

### Cloudflare公式設定を採用

`build/doom-wasm/configure.ac`のメモリ設定を**Cloudflare公式リポジトリと同じ設定**に変更しました：

| 設定 | Cloudflare公式値 | 説明 |
|------|------------------|------|
| TOTAL_MEMORY | **64MB (67108864)** | 固定メモリサイズ |
| ALLOW_MEMORY_GROWTH | **0 (無効)** | メモリ成長を無効化 |
| ASSERTIONS | **0 (無効)** | パフォーマンス優先 |
| SAFE_HEAP | **1 (有効)** | ヒープチェック |
| STACK_OVERFLOW_CHECK | **1 (有効)** | スタックチェック |
| 最適化レベル | **-O3** | 最高レベル |

**重要**: メモリ成長を無効にすることで、ポインタの安定性が向上し、メモリアクセスエラーを防止します。

### 入力設定の最適化

キャンバス内でのプレイとコントローラー操作に最適化するため、以下の設定を適用しています：

| 設定ファイル | 項目 | 値 | 説明 |
|-------------|------|-----|------|
| `default.cfg` | `use_mouse` | **0 (無効)** | マウス入力を無効化 |
| `default.cfg` | `use_joystick` | **1 (有効)** | ジョイスティック/コントローラー入力を有効化 |
| `default.cfg` | `grabmouse` | **0 (無効)** | マウスキャプチャを無効化 |
| `default.cfg` | `fullscreen` | **0 (無効)** | フルスクリーンを無効化 |
| `configure.ac` | `DISABLE_DEPRECATED_FIND_EVENT_TARGET_BEHAVIOR` | **1** | 古いイベント動作を無効化 |
| `configure.ac` | `-DDISABLE_FULLSCREEN` | **定義済み** | フルスクリーン機能をビルド時に無効化 |
| `configure.ac` | `-DDISABLE_MOUSE_GRAB` | **定義済み** | マウスグラブをビルド時に無効化 |

**重要**: これらの設定により、ゲームはキャンバス内でのみ動作し、マウス操作を要求せず、コントローラー操作に集中できます。

## ビルド手順

### 前提条件

Emscriptenとビルドツールがインストールされている必要があります：

```bash
# macOS (Homebrew)
brew install emscripten automake sdl2 sdl2_mixer sdl2_net

# Linux (Ubuntu/Debian)
sudo apt-get install emscripten automake libsdl2-dev libsdl2-mixer-dev libsdl2-net-dev
```

### ビルドコマンド

```bash
# プロジェクトルートから実行
./scripts/build-doom-wasm.sh
```

このスクリプトは以下を実行します：

1. `build/doom-wasm`ディレクトリが存在しない場合、Cloudflareのdoom-wasmをクローン
2. 前回のビルドをクリーン
3. 更新されたメモリ設定で再ビルド
4. ビルド成果物を`packages/pages/public/doom/`にコピー

### ビルド時間

初回ビルド: 約5-10分（環境により異なる）
再ビルド: 約3-5分

## ビルド成果物

ビルドが成功すると、以下のファイルが生成されます：

```
packages/pages/public/doom/
├── websockets-doom.js    # Emscriptenランタイム
├── websockets-doom.wasm  # DOOMエンジン本体
├── default.cfg           # DOOM設定ファイル
└── doom1.wad            # DOOM Shareware WAD（オプション）
```

## doom1.wadのダウンロード（オプション）

デフォルトWADを使用する場合：

```bash
# doom1.wadをダウンロード
curl -o build/doom-wasm/src/doom1.wad https://distro.ibiblio.org/slitaz/sources/packages/d/doom1.wad

# ビルドスクリプトを再実行してコピー
./scripts/build-doom-wasm.sh
```

## 確認方法

ビルド後、開発サーバーを起動してテスト：

```bash
bun run --filter @web-doom/pages dev
```

ブラウザのコンソールで以下を確認：

```
[DOOM] WebAssembly runtime initialized
```

**重要**: 以前にビルドしたWASMをブラウザがキャッシュしている場合、**必ずブラウザのキャッシュをクリア**してください：

- Chrome/Edge: `Shift + F5` または `Ctrl/Cmd + Shift + R`
- Firefox: `Ctrl/Cmd + Shift + Delete` → キャッシュをクリア
- Safari: `Cmd + Option + E`

ゲーム開始後、メモリエラーが発生しないことを確認してください。

## 重要な注意事項

### キャンバス解像度の制限

Chocolate DOOMは元々低解像度を想定しているため、**キャンバス解像度は640x480以下**を推奨します。

| 解像度 | 状態 | 備考 |
|--------|------|------|
| 320x200 | ✅ 推奨 | オリジナルDOOM解像度 |
| 640x480 | ✅ 推奨 | 標準的な解像度（現在の設定） |
| 800x600 | ⚠️ 注意 | メモリ使用量が増加 |
| 960x720 | ❌ 非推奨 | メモリアクセスエラーの原因 |

**高解像度でメモリエラーが発生する理由：**
- フレームバッファのサイズが増大（960x720 = 691,200ピクセル vs 640x480 = 307,200ピクセル）
- レンダリングバッファやZバッファも比例して増加
- ASYNCIFY スタックも圧迫される

現在の実装では**640x480**に設定されています（packages/pages/src/pages/DoomPlayerPage.tsx:66）。

## トラブルシューティング

### Emscriptenが見つからない

```bash
# Emscriptenのパスを確認
which emcc

# パスが通っていない場合
source /path/to/emsdk/emsdk_env.sh
```

### ビルドエラーが発生する

```bash
# クリーンビルド
cd build/doom-wasm
./scripts/clean.sh
./scripts/build.sh
```

### それでも解決しない場合

doom-wasmディレクトリを削除して再クローン：

```bash
rm -rf build/doom-wasm
./scripts/build-doom-wasm.sh
```

## 参考リンク

- [Cloudflare doom-wasm](https://github.com/cloudflare/doom-wasm)
- [Emscripten Documentation](https://emscripten.org/)
- [WebAssembly Memory](https://developer.mozilla.org/en-US/docs/WebAssembly/JavaScript_interface/Memory)
