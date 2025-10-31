# Batch Controller Generation for Pages

このドキュメントでは、複数スタイルのコントローラー画像を一括生成し、@web-doom/pagesで使用する方法を説明します。

## 概要

`batch-transform.ts`スクリプトを使用して、以下を自動生成できます：

- **ランドスケープ版とポートレート版**の両方のコントローラー画像
- 複数のスタイルプリセット（Cyberpunk、Retro、Steampunk等）
- **manifest.json**（メタデータとファイル一覧）
- すべて`pages/public/controllers/`に出力され、即座にWebページで使用可能

## 使用方法

### 1. 環境設定

`.env`ファイルにAPIキーを設定：

```bash
# Geminiを使用する場合
GEMINI_API_KEY=your_gemini_api_key_here

# または Nanobananaを使用する場合
NANOBANANA_API_KEY=your_nanobanana_api_key_here
```

### 2. バッチ生成の実行

```bash
# Auto-detect backend (Gemini優先、フォールバックでNanobanana)
bun run example:controller:batch

# Geminiを指定
bun run example:controller:batch gemini

# Nanobananaを指定
bun run example:controller:batch nanobanana
```

### 3. 生成内容

実行すると、以下のファイルが生成されます：

```
packages/pages/public/controllers/
├── manifest.json                        # メタデータ
├── controller-landscape-cyberpunk.png   # ランドスケープ版
├── controller-portrait-cyberpunk.png    # ポートレート版
├── controller-landscape-retro.png
├── controller-portrait-retro.png
├── controller-landscape-steampunk.png
├── controller-portrait-steampunk.png
├── controller-landscape-neon.png
├── controller-portrait-neon.png
├── controller-landscape-metal.png
└── controller-portrait-metal.png
```

**合計**: 5スタイル × 2方向 = **10画像** + manifest.json

## Pages での使用方法

### TypeScript型定義のインポート

```typescript
import type {
  ControllerAssetsManifest,
  ControllerAsset,
} from '@web-doom/game-controller';

import {
  getAssetsByOrientation,
  getAssetById,
  getAssetUrl,
} from '@web-doom/game-controller';
```

### manifest.jsonの読み込み

```typescript
async function loadControllerAssets(): Promise<ControllerAssetsManifest> {
  const response = await fetch('/controllers/manifest.json');
  return await response.json();
}
```

### Reactコンポーネントでの使用例

```tsx
function ControllerSelector() {
  const [manifest, setManifest] = useState<ControllerAssetsManifest | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('cyberpunk');

  useEffect(() => {
    loadControllerAssets().then(setManifest);
  }, []);

  if (!manifest) return <div>Loading...</div>;

  const landscapeAssets = getAssetsByOrientation(manifest, 'landscape');

  return (
    <div>
      {landscapeAssets.map((asset) => (
        <div key={asset.id}>
          <img src={getAssetUrl(asset)} alt={asset.name} />
          <p>{asset.name}</p>
        </div>
      ))}
    </div>
  );
}
```

### ヘルパー関数

```typescript
// 方向別にフィルタ
const portraitControllers = getAssetsByOrientation(manifest, 'portrait');

// IDで検索
const cyberpunkLandscape = getAssetById(manifest, 'cyberpunk-landscape');

// URL取得
const url = getAssetUrl(asset); // => "/controllers/controller-landscape-cyberpunk.png"
```

## スタイルプリセット

現在、以下の5つのスタイルが用意されています：

| ID | 名前 | 説明 |
|----|------|------|
| `cyberpunk` | Cyberpunk Neon | サイバーパンク風ネオンスタイル、ホログラフィックボタン |
| `retro` | Retro Arcade | レトロアーケード風、80年代の美学、CRTスキャンライン |
| `steampunk` | Steampunk | スチームパンク機械風、真鍮ボタン、歯車、ビクトリア朝装飾 |
| `neon` | Neon Glow | ネオンピンク＆ブルー、発光ボタン、暗い背景 |
| `metal` | Metal Industrial | インダストリアルメタル、クロームボタン、鋼鉄テクスチャ |

## manifest.json フォーマット

```json
{
  "version": "1.0.0",
  "generatedAt": "2025-10-30T10:00:00.000Z",
  "backend": "gemini",
  "totalAssets": 10,
  "orientations": {
    "landscape": 5,
    "portrait": 5
  },
  "assets": [
    {
      "id": "cyberpunk-landscape",
      "name": "Cyberpunk Neon (Landscape)",
      "filename": "controller-landscape-cyberpunk.png",
      "orientation": "landscape",
      "style": "cyberpunk neon style with holographic buttons...",
      "width": 1280,
      "height": 560,
      "model": "gemini-2.5-flash-image",
      "prompt": "Transform this game controller image...",
      "generatedAt": "2025-10-30T10:00:00.000Z"
    }
    // ... more assets
  ]
}
```

## カスタムスタイルの追加

`examples/batch-transform.ts`の`styles`配列に追加：

```typescript
const styles = [
  // 既存のスタイル...
  {
    id: 'custom',
    name: 'Custom Style',
    style: 'your custom style description here',
    strength: 0.75,
  },
];
```

## 注意事項

- **生成時間**: 1画像あたり30-60秒程度かかります（10画像で5-10分）
- **レート制限**: スクリプトは自動的に画像間で2秒待機します
- **APIコスト**: Gemini/Nanobananaの料金体系を確認してください
- **.gitignore**: 生成された画像をgitにコミットする場合は`.gitignore`を調整

## トラブルシューティング

### APIキーエラー

```
❌ Error: GEMINI_API_KEY not found
```

→ `.env`ファイルを作成し、適切なAPIキーを設定してください

### 出力先が見つからない

スクリプトは自動的に`packages/pages/public/controllers/`ディレクトリを作成しますが、
`pages`パッケージが存在することを確認してください。

### 生成失敗

個別の画像生成が失敗しても、スクリプトは続行します。
失敗したスタイルのみ再実行する場合は、`styles`配列を編集してください。

## サンプルファイル

- `packages/pages/public/controllers/manifest.example.json` - manifestのサンプル
- `packages/pages/src/examples/load-controller-assets.example.ts` - 使用例コード

## 関連ファイル

- `examples/batch-transform.ts` - バッチ生成スクリプト
- `src/transformers/assets.ts` - TypeScript型定義
- `src/transformers/image-transformer-client.ts` - 変換クライアント
