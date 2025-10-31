# Controller Theme System

Pages側でテーマIDを指定するだけで、スタイル付きコントローラーを簡単に使えるテーマシステムです。

## 特徴

- **10種類の定義済みテーマ**: Cyberpunk、Retro、Steampunk、DOOM等
- **テーマIDで指定**: `theme="cyberpunk"` だけで使える
- **自動キャッシュ**: 事前生成された画像があれば自動読み込み
- **フォールバック**: 画像がなければオリジナルSVGで表示
- **React Hooks対応**: `useThemedController`で簡単統合
- **UIコンポーネント付き**: `ThemeSelector`でテーマ選択UI

## クイックスタート

### 1. 基本的な使い方

```tsx
import { ThemedController, doomControllerSchema } from '@web-doom/game-controller';

function MyGame() {
  return (
    <ThemedController
      schema={doomControllerSchema}
      theme="cyberpunk"  // ← テーマIDを指定するだけ！
      onInput={(event) => console.log(event)}
    />
  );
}
```

### 2. テーマ選択UIつき

```tsx
import {
  ThemedController,
  ThemeSelector,
  doomControllerSchema,
} from '@web-doom/game-controller';

function MyGame() {
  const [theme, setTheme] = useState('cyberpunk');

  return (
    <div>
      <ThemeSelector
        value={theme}
        onChange={setTheme}
        mode="grid"  // or "list" or "dropdown"
      />

      <ThemedController
        schema={doomControllerSchema}
        theme={theme}
        onInput={(event) => console.log(event)}
      />
    </div>
  );
}
```

### 3. React Hookで細かく制御

```tsx
import {
  useThemedController,
  GameController,
  doomControllerSchema,
} from '@web-doom/game-controller';

function MyGame() {
  const { imageUrl, loading, theme, isCached } = useThemedController({
    schema: doomControllerSchema,
    theme: 'cyberpunk',
  });

  if (loading) return <div>Loading {theme.name}...</div>;

  return (
    <div>
      <p>Using {isCached ? 'pre-generated' : 'original'} image</p>
      <GameController
        schema={doomControllerSchema}
        backgroundImage={imageUrl}
        onInput={(event) => console.log(event)}
      />
    </div>
  );
}
```

## 利用可能なテーマ

| テーマID | 名前 | カテゴリ | 説明 |
|---------|------|---------|------|
| `cyberpunk` | Cyberpunk Neon | sci-fi | サイバーパンク風ネオンライト |
| `retro` | Retro Arcade | retro | 80年代アーケードスタイル |
| `steampunk` | Steampunk | industrial | ビクトリア朝機械スタイル |
| `neon` | Neon Glow | sci-fi | ネオンピンク＆ブルー |
| `metal` | Metal Industrial | industrial | インダストリアルメタル |
| `doom` | DOOM Classic | sci-fi | DOOM風ヘルファイア |
| `vaporwave` | Vaporwave | retro | 90年代ベイパーウェーブ |
| `minimal` | Minimal Clean | minimal | ミニマルクリーンデザイン |
| `carbon` | Carbon Fiber | industrial | カーボンファイバーテクスチャ |
| `fantasy` | Fantasy Magic | fantasy | ファンタジー魔法ルーン |

## テーマの追加・カスタマイズ

`src/transformers/themes.ts`で新しいテーマを追加できます：

```typescript
export const CONTROLLER_THEMES: Record<string, ControllerTheme> = {
  // 既存のテーマ...

  myCustomTheme: {
    id: 'myCustomTheme',
    name: 'My Custom Theme',
    description: 'My awesome custom style',
    stylePrompt: 'detailed description for AI transformation',
    strength: 0.8,
    category: 'sci-fi',
    previewColors: {
      primary: '#ff0000',
      secondary: '#00ff00',
      accent: '#0000ff',
    },
  },
};
```

## 事前生成画像の作成

テーマを追加したら、バッチ生成で画像を作成：

```bash
# 全テーマ × 両方向 = 20画像を生成
bun run example:controller:batch gemini

# または特定のバックエンドを指定
bun run example:controller:batch nanobanana
```

生成された画像は自動的に`pages/public/controllers/`に保存され、
`ThemedController`が自動的に読み込みます。

## ディレクトリ構造

```
packages/
├── game-controller/
│   ├── src/
│   │   ├── transformers/
│   │   │   ├── themes.ts           # テーマ定義（ここを編集）
│   │   │   └── assets.ts
│   │   ├── hooks/
│   │   │   └── useThemedController.ts
│   │   └── components/
│   │       └── ThemedController.tsx
│   └── examples/
│       └── batch-transform.ts      # バッチ生成スクリプト
└── pages/
    └── public/
        └── controllers/            # 生成画像の保存先
            ├── manifest.json
            ├── controller-landscape-cyberpunk.png
            ├── controller-portrait-cyberpunk.png
            └── ...
```

## APIリファレンス

### ThemedController

```tsx
<ThemedController
  schema={doomControllerSchema}
  theme="cyberpunk" | themeObject
  useCache={true}                    // 事前生成画像を使用
  assetsBaseUrl="/controllers"       // 画像の保存先
  onInput={(event) => {}}
  showLoading={true}
  loadingComponent={<Custom />}
  errorComponent={(error, retry) => <Custom />}
/>
```

### useThemedController

```tsx
const {
  imageUrl,        // 画像URL
  loading,         // ロード中
  error,           // エラー
  theme,           // 現在のテーマ
  isCached,        // 事前生成版を使用中
  retry,           // 再試行
} = useThemedController({
  schema: doomControllerSchema,
  theme: 'cyberpunk',
  useCache: true,
  assetsBaseUrl: '/controllers',
  fallbackToOriginal: true,
});
```

### ThemeSelector

```tsx
<ThemeSelector
  value="cyberpunk"
  onChange={setTheme}
  mode="grid" | "list" | "dropdown"
  themes={['cyberpunk', 'retro', 'neon']}  // 表示するテーマを限定
/>
```

### ヘルパー関数

```tsx
import {
  getTheme,             // ID→テーマオブジェクト
  getAllThemes,         // 全テーマ取得
  getThemesByCategory,  // カテゴリ別フィルタ
  getDefaultTheme,      // デフォルトテーマ
} from '@web-doom/game-controller';

const theme = getTheme('cyberpunk');
const allThemes = getAllThemes();
const sciFiThemes = getThemesByCategory('sci-fi');
```

## 動作フロー

1. **`<ThemedController>`レンダリング**
   - テーマIDから`CONTROLLER_THEMES`を検索

2. **画像読み込み試行**
   - `/controllers/controller-landscape-cyberpunk.png`をチェック
   - 存在すれば表示（キャッシュ）

3. **フォールバック**
   - 画像がなければオリジナルSVG表示
   - またはエラー表示（`fallbackToOriginal: false`の場合）

## まとめ

- **テーマIDを指定するだけ** → `theme="cyberpunk"`
- **事前生成なしでも動作** → オリジナルSVGで表示
- **事前生成すると高速** → バッチスクリプト1回実行
- **カスタマイズ簡単** → `themes.ts`にテーマ追加

これでもう面倒な設定は不要です！
