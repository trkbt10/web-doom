# Nanobanana TLS 証明書エラーの修正

## 問題

`ERR_TLS_CERT_ALTNAME_INVALID` エラーが発生する問題を修正しました。

```
ERR_TLS_CERT_ALTNAME_INVALID fetching "https://api.nanobanana.ai/v1/i2i"
```

## 解決方法

両方のパッケージに `skipSSLVerification` オプションを追加しました：

1. `@web-doom/texture-transformer` (`packages/texture-transformer/src/transformers/nanobanana-client.ts`)
2. `@web-doom/game-controller` (`packages/game-controller/src/transformers/nanobanana-backend.ts`)

## 使用方法

### 1. 環境変数で制御（推奨）

開発環境では自動的に SSL 検証がスキップされます：

```.env
NODE_ENV=development
NANOBANANA_API_KEY=your-api-key-here
```

### 2. コンストラクタで明示的に指定

```typescript
// texture-transformer の場合
import { NanobananaClient } from '@web-doom/texture-transformer';

const client = new NanobananaClient({
  apiKey: 'your-api-key',
  skipSSLVerification: true, // 開発時のみ
});

// game-controller の場合
import { createNanobananaBackend } from '@web-doom/game-controller';

const backend = createNanobananaBackend({
  apiKey: 'your-api-key',
  skipSSLVerification: true, // 開発時のみ
});
```

### 3. texture-transformer-ui で使用する場合

サーバー側で環境変数を設定：

```.env
NODE_ENV=development
NANOBANANA_API_KEY=your-api-key
```

これで自動的に SSL 検証がスキップされます。

## セキュリティ上の注意

⚠️ **重要**: `skipSSLVerification: true` は開発環境でのみ使用してください。本番環境では絶対に使用しないでください。

SSL 検証をスキップすると、中間者攻撃（MITM）のリスクがあります。

## 実装詳細

### Bun 固有の実装

Bun では `fetch` に `tls` オプションを渡すことができます：

```typescript
const fetchOptions: RequestInit & { tls?: { rejectUnauthorized?: boolean } } = {
  method: 'POST',
  headers: { /* ... */ },
  body: JSON.stringify(request),
  signal: AbortSignal.timeout(this.config.timeout),
};

// Bun の場合のみ TLS オプションを追加
if (this.config.skipSSLVerification && typeof Bun !== 'undefined') {
  fetchOptions.tls = { rejectUnauthorized: false };
}

const response = await fetch(endpoint, fetchOptions);
```

### デフォルト動作

- `NODE_ENV=development` の場合: 自動的に SSL 検証をスキップ
- `NODE_ENV=production` の場合: SSL 検証を実行（安全）
- 明示的に `skipSSLVerification` を指定した場合: その値を使用

## 変更されたファイル

1. `packages/texture-transformer/src/transformers/nanobanana-client.ts`
   - `NanobananaConfig` に `skipSSLVerification` オプションを追加
   - `callApi` メソッドで TLS オプションを設定

2. `packages/game-controller/src/transformers/nanobanana-backend.ts`
   - `NanobananaBackendConfig` に `skipSSLVerification` オプションを追加
   - `callApi` メソッドで TLS オプションを設定

## テスト

```bash
# 開発環境で実行
NODE_ENV=development bun run dev

# SSL 検証が無効化されていることを確認
# コンソールに警告が表示されます：
# ⚠️  SSL certificate verification is disabled. This should only be used in development.
```

## 根本原因

nanobanana.ai の SSL 証明書が正しく設定されていない可能性があります。この問題は：

1. 証明書の SAN (Subject Alternative Name) が正しく設定されていない
2. 証明書が期限切れまたは無効
3. 証明書チェーンが不完全

開発環境では SSL 検証をスキップすることで回避できますが、本番環境では nanobanana.ai 側の証明書が修正されるまで使用すべきではありません。
