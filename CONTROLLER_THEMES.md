# Controller Theme System - Quick Guide

DOOMプレイヤーページでコントローラーのテーマを即座に選択・適用できるシステムです。

## 使い方（ユーザー向け）

### ゲーム開始前
1. DOOMプレイヤーページを開く
2. WAD選択画面の下に「🎨 Controller Theme」セクションがあります
3. ドロップダウンから好きなテーマを選択
4. 選択したテーマは自動的に保存されます（localStorage）

### 利用可能なテーマ

- **DOOM Classic** - クラシックDOOMスタイル（デフォルト）
- **Cyberpunk Neon** - サイバーパンク風ネオン
- **Retro Arcade** - 80年代アーケード
- **Steampunk** - ビクトリア朝機械
- **Neon Glow** - ネオングロー
- **Vaporwave** - 90年代ベイパーウェーブ
- **Minimal Clean** - ミニマルデザイン
- **Carbon Fiber** - カーボンファイバー
- **Fantasy Magic** - ファンタジー魔法
- **Metal Industrial** - インダストリアルメタル

### 特徴

- ✅ **即座に反映**: テーマ選択後、ゲーム開始時に自動適用
- ✅ **自動保存**: 選択したテーマは次回も保持
- ✅ **両方向対応**: ランドスケープ/ポートレート両方に対応
- ✅ **フォールバック**: 事前生成画像がなくても動作

## 開発者向け

### 実装場所

- **テーマ定義**: `packages/game-controller/src/transformers/themes.ts`
- **コントローラー**: `packages/pages/src/doom/DoomController.tsx`
- **メインページ**: `packages/pages/src/pages/DoomPlayerPage.tsx`

### テーマ追加方法

1. `themes.ts`に新しいテーマを追加:
```typescript
myNewTheme: {
  id: 'myNewTheme',
  name: 'My New Theme',
  description: 'Description here',
  stylePrompt: 'AI transformation prompt',
  strength: 0.8,
  category: 'sci-fi',
  previewColors: {
    primary: '#ff0000',
    secondary: '#00ff00',
    accent: '#0000ff',
  },
}
```

2. 画像を生成（オプション）:
```bash
bun run example:controller:batch gemini
```

3. ビルド:
```bash
bun run build
```

### コンポーネント使用例

```tsx
import { DoomController } from '../doom';

<DoomController
  onInput={handleInput}
  schema={controllerSchema}
  theme="cyberpunk"  // ← テーマIDを指定
/>
```

### 状態管理

```tsx
// テーマ状態（localStorage永続化）
const [theme, setTheme] = useState(() => {
  return localStorage.getItem('doom-controller-theme') || 'doom';
});

// 変更時に保存
useEffect(() => {
  localStorage.setItem('doom-controller-theme', theme);
}, [theme]);
```

## ファイル構成

```
packages/
├── game-controller/
│   ├── src/
│   │   ├── transformers/
│   │   │   └── themes.ts           # テーマ定義
│   │   ├── hooks/
│   │   │   └── useThemedController.ts
│   │   └── components/
│   │       └── ThemedController.tsx
│   └── examples/
│       └── batch-transform.ts      # バッチ生成
└── pages/
    ├── src/
    │   ├── doom/
    │   │   └── DoomController.tsx  # DOOM専用ラッパー
    │   └── pages/
    │       └── DoomPlayerPage.tsx  # メインページ
    └── public/
        └── controllers/            # 生成画像
            ├── manifest.json
            └── controller-*.png
```

## トラブルシューティング

### テーマが適用されない
- ブラウザのコンソールでエラーを確認
- `packages/pages/public/controllers/`に画像があるか確認
- フォールバックが有効なので、画像がなくてもSVG版が表示されます

### 新しいテーマが表示されない
- `themes.ts`にテーマを追加したか確認
- ビルドし直したか確認
- ブラウザのキャッシュをクリア

## 関連ドキュメント

- `packages/game-controller/THEME_SYSTEM.md` - 詳細なテーマシステムガイド
- `packages/game-controller/BATCH_GENERATION.md` - バッチ生成ガイド
