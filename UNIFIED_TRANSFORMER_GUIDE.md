# Unified Transformer Guide

統一画像変換クライアントにより、Gemini と Nanobanana を同じインターフェースで簡単に使い分けることができます。

## 概要

`createImageTransformer` を使用することで、バックエンド（Gemini / Nanobanana）を切り替えながら同じコードでテクスチャ変換が可能です。

## 基本的な使い方

### 1. 自動検出（推奨）

API キーが設定されているバックエンドを自動で選択します：

```typescript
import { createImageTransformer } from '@web-doom/texture-transformer';

const client = createImageTransformer({
  backend: 'auto', // 自動検出
});

console.log(`Using: ${client.getBackendName()}`); // "gemini" または "nanobanana"
```

### 2. バックエンドを明示的に指定

```typescript
// Gemini を使用
const geminiClient = createImageTransformer({
  backend: 'gemini',
  apiKey: process.env.GEMINI_API_KEY,
});

// Nanobanana を使用
const nanobananaClient = createImageTransformer({
  backend: 'nanobanana',
  apiKey: process.env.NANOBANANA_API_KEY,
  skipSSLVerification: true, // 開発時のみ
});
```

## テクスチャ変換

### 単一テクスチャの変換

```typescript
import { extractTextures } from '@web-doom/texture-transformer';
import { decode } from '@web-doom/wad';

// WAD からテクスチャを抽出
const wad = decode(wadBuffer);
const textures = extractTextures(wad);

// クライアント作成
const client = createImageTransformer({ backend: 'auto' });

// 変換
const result = await client.transform(textures[0], {
  style: 'with high-quality anime aesthetic',
  // バックエンド固有のオプション
  nanobananaOptions: {
    strength: 0.75,
    steps: 30,
    guidanceScale: 7.5,
  },
});

if (result.status === 'success') {
  console.log('Transformed!', result.transformed);
}
```

### バッチ処理

```typescript
// 複数テクスチャを順次処理
const results = await client.transformBatch(textures, {
  style: 'cyberpunk neon aesthetic',
}, (completed, total) => {
  console.log(`Progress: ${completed}/${total}`);
});
```

### 並列処理

```typescript
// 並列度 3 で処理
const results = await client.transformConcurrent(
  textures,
  { style: 'anime style' },
  3, // 同時に 3 つまで
  (completed, total) => {
    console.log(`Progress: ${completed}/${total}`);
  }
);
```

## バックエンド固有のオプション

### Gemini

```typescript
const result = await client.transform(texture, {
  style: 'detailed anime art',
  // Gemini は追加オプション不要
});
```

### Nanobanana

```typescript
const result = await client.transform(texture, {
  style: 'detailed anime art',
  nanobananaOptions: {
    strength: 0.8,        // 変換の強さ (0-1)
    steps: 35,            // ステップ数
    guidanceScale: 8.0,   // ガイダンススケール
    seed: 12345,          // シード値（再現性）
    negativePrompt: 'low quality, blurry',
  },
});
```

## CLI スクリプト

### バッチ変換スクリプト

```bash
# 自動検出
bun run cli/batch-transform-example.ts assets/freedoom1.wad

# Gemini を指定
bun run cli/batch-transform-example.ts assets/freedoom1.wad gemini

# Nanobanana を指定（出力先も指定）
bun run cli/batch-transform-example.ts assets/freedoom1.wad nanobanana output/
```

## texture-transformer-ui での使用

UI サーバーでは自動的に統一クライアントを使用します：

```typescript
// server/services/transform-service.ts
import { createImageTransformer } from '@web-doom/texture-transformer';

function getTransformerClient(transformer: 'nanobanana' | 'gemini') {
  return createImageTransformer({
    backend: transformer,
    apiKey: process.env[`${transformer.toUpperCase()}_API_KEY`],
    skipSSLVerification: process.env.NODE_ENV === 'development',
  });
}
```

## 環境変数

```.env
# どちらか一方、または両方を設定
GEMINI_API_KEY=your-gemini-api-key
NANOBANANA_API_KEY=your-nanobanana-api-key

# 開発環境では SSL 検証をスキップ（Nanobanana のみ）
NODE_ENV=development
```

## バックエンド比較

### Gemini
- ✅ 高品質な出力
- ✅ 安定した API
- ✅ SSL 証明書の問題なし
- ⚠️ 料金がやや高め
- ⚠️ レート制限あり

### Nanobanana
- ✅ 高速な処理
- ✅ 細かいパラメータ調整可能
- ✅ 比較的安価
- ⚠️ SSL 証明書の問題あり（開発環境で回避可能）
- ⚠️ 品質にばらつきがある場合あり

## エラーハンドリング

```typescript
const client = createImageTransformer({ backend: 'auto' });

const result = await client.transform(texture, { style: 'anime' });

if (result.status === 'failed') {
  console.error('Transform failed:', result.error);
  // エラー処理
} else {
  console.log('Success!', result.transformed);
}
```

## ベストプラクティス

1. **自動検出を活用**: `backend: 'auto'` で API キーの有無を自動判定
2. **開発と本番を分ける**: 環境変数で設定を切り替え
3. **バッチ処理には並列処理**: `transformConcurrent` で効率化
4. **エラーハンドリング**: 常に `status` をチェック
5. **SSL 検証**: 本番環境では必ず有効にする

## game-controller との違い

- **game-controller**: コントローラー画像の変換に特化
- **texture-transformer**: WAD テクスチャの変換に特化

どちらも同じ統一インターフェースを使用しており、コードの共通化が図られています。

## まとめ

統一クライアントにより：
- ✅ Gemini と Nanobanana を簡単に切り替え
- ✅ 同じコードで両方のバックエンドに対応
- ✅ バッチ処理、並列処理が簡単
- ✅ エラーハンドリングが統一的
- ✅ TLS 証明書の問題も自動対応

これで texture-transformer と game-controller の両方で、統一された方法で画像変換が可能になりました。
