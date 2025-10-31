# スプライトシート座標の流れ - 完全ガイド

## 🎯 概要

このドキュメントは、スプライトシート生成から抽出までの座標の流れを説明します。
**オリジナルのスプライト領域が正しくピックされることを保証**しています。

## 📐 座標システム

### 座標の種類

1. **Cell 座標** - セル全体（パディング + スプライト + ラベル領域）
2. **Content 座標** - 実際のスプライト画像の領域（これが重要！）
3. **Guideline 座標** - 枠線の描画位置（スプライトと重ならない）

### 座標の関係

```
┌─────────────────────────────────────────┐
│ Cell (x, y)                             │  ← セル全体
│  ┌───────────────────────────────────┐  │
│  │ Guideline Outer (offset +3px)     │  │  ← 外側枠線
│  │  ┌─────────────────────────────┐  │  │
│  │  │ Guideline Inner (offset-3px)│  │  │  ← 内側枠線
│  │  │  ┌─────────────────────────┐│  │  │
│  │  │  │ Content (x, y)         ││  │  │  ← スプライト画像
│  │  │  │                         ││  │  │    (ここが抽出対象！)
│  │  │  │   [Sprite Image]        ││  │  │
│  │  │  │                         ││  │  │
│  │  │  └─────────────────────────┘│  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
│           [Sprite Name Label]           │  ← ラベル領域
└─────────────────────────────────────────┘
```

**重要**:
- **画像配置**: `Content (x, y)` に配置
- **保存**: `Content (x, y, width, height)` を Layout として保存
- **抽出**: 保存された `Content` 座標から抽出
- **枠線**: `Content` の外側（±3px）に描画

## 🔄 座標の流れ

### ステップ 1: パッキング (`sprite-packer.ts`)

```typescript
// 1. テクスチャをパッキング
const packResult = packTextures(textureData);

// 2. 各テクスチャの座標を計算
for (const texture of textures) {
  // セルの位置を決定
  const placementX = 0;  // 例
  const placementY = 0;

  // レイアウトを計算
  const layout = calculateSpriteLayout(
    texture.name,
    placementX,      // セルのX座標
    placementY,      // セルのY座標
    texture.width,   // 実際の画像幅
    texture.height   // 実際の画像高さ
  );

  // 結果:
  // - layout.cell.x, .y        : セル全体の位置
  // - layout.content.x, .y     : 画像配置位置 (cell + PADDING)
  // - layout.content.width, .height : 画像サイズ
  // - layout.guidelines.inner  : 内側枠線 (content - OFFSET)
  // - layout.guidelines.outer  : 外側枠線 (cell + OFFSET)
}
```

**座標計算ロジック** (`sprite-coordinates.ts`):
```typescript
const PADDING = 12;           // セル境界からコンテンツまで
const GUIDELINE_OFFSET = 3;   // コンテンツから枠線まで

// コンテンツ位置 = セル位置 + パディング
contentX = cellX + PADDING;    // 例: 0 + 12 = 12
contentY = cellY + PADDING;    // 例: 0 + 12 = 12

// 内側枠線 = コンテンツ位置 - オフセット
guidelineInner.x = contentX - GUIDELINE_OFFSET;  // 例: 12 - 3 = 9
guidelineInner.y = contentY - GUIDELINE_OFFSET;  // 例: 12 - 3 = 9
```

### ステップ 2: 画像配置 (`texture-group-manager.ts:generateSpriteSheet`)

```typescript
// 1. スプライトシートキャンバスを作成
const canvas = sharp({ create: { width, height, channels: 4 } });

// 2. 各画像をコンテンツ位置に配置
const composites = packResult.textures.map(texture => {
  return {
    input: texture.imageData,
    left: texture.contentX,    // ← Content X座標を使用
    top: texture.contentY,     // ← Content Y座標を使用
  };
});

// 3. 合成
await canvas.composite(composites).png().toBuffer();

// ログ出力例:
// [Sprite Placement] PLAYA1: Cell(0, 0, 76x128) Content(12, 12, 52x92)
```

### ステップ 3: レイアウト保存

```typescript
// Content座標をLayoutとして保存
const layout: TextureLayout[] = packResult.textures.map(t => ({
  textureName: t.name,
  x: t.contentX,        // ← Content X座標を保存
  y: t.contentY,        // ← Content Y座標を保存
  width: t.contentWidth,   // ← 実際の画像幅
  height: t.contentHeight, // ← 実際の画像高さ
}));

// ログ出力例:
// [Layout Saved] PLAYA1: Extract from (12, 12, 52x92)
```

### ステップ 4: 枠線描画 (`addGridGuidelines`)

```typescript
// 枠線はスプライトと重ならない位置に描画
for (const texture of textures) {
  const { guidelines } = texture.layout;

  // 外側枠線 (lime, 点線)
  drawRect(guidelines.outer.x, guidelines.outer.y, ...);

  // 内側枠線 (cyan, 実線) - コンテンツの外側
  drawRect(guidelines.inner.x, guidelines.inner.y, ...);

  // inner.x = contentX - 3
  // inner.y = contentY - 3
  // → スプライトには重ならない！
}
```

### ステップ 5: 抽出 (`extractTexturesFromSpriteSheet`)

```typescript
// 保存されたLayout座標を使用して抽出
for (const layout of group.layout) {
  const extracted = await sharp(spriteSheetBuffer)
    .extract({
      left: layout.x,      // ← 保存されたContent X
      top: layout.y,       // ← 保存されたContent Y
      width: layout.width,   // ← 保存された画像幅
      height: layout.height, // ← 保存された画像高さ
    });

  // ログ出力例:
  // [Extracting] PLAYA1: from (12, 12, 52x92)
}
```

## ✅ 整合性の保証

### 自動検証

スプライトシート生成時に自動的に以下を検証します：

1. **パッキング検証** (`validatePackedTextures`)
   - Content がCell内にあるか
   - Content がキャンバス内にあるか
   - 枠線がスプライトと重ならないか

2. **レイアウト整合性検証** (`validateLayoutConsistency`)
   - 保存されたLayout座標 = PackedTextureのContent座標
   - 全てのテクスチャがLayoutに含まれるか

### 検証ログ出力

```
🔍 Validating packed texture coordinates...
=== Sprite Layout Validation Report ===
Status: ✅ VALID

📊 COORDINATE DETAILS:

  PLAYA1:
    Cell:       (0, 0) 76x128
    Content:    (12, 12) 52x92
    Extraction: (12, 12) 52x92
    Guidelines:
      Outer: (3, 3) 70x122
      Inner: (9, 9) 58x98

🔍 Validating layout consistency...
=== Sprite Layout Validation Report ===
Status: ✅ VALID

✅ All validations passed! Sprite coordinates are consistent.
```

## 🎨 具体例

### 例: 52x92 のスプライト

```
PADDING = 12
GUIDELINE_OFFSET = 3
LABEL_HEIGHT = 20
GAP = 8

Cell:
  x = 0
  y = 0
  width = 52 + 12*2 = 76
  height = 92 + 12*2 + 20 = 136

Content (画像配置位置):
  x = 0 + 12 = 12
  y = 0 + 12 = 12
  width = 52
  height = 92

Guideline Inner (内側枠線):
  x = 12 - 3 = 9
  y = 12 - 3 = 9
  width = 52 + 3*2 = 58
  height = 92 + 3*2 = 98

Guideline Outer (外側枠線):
  x = 0 + 3 = 3
  y = 0 + 3 = 3
  width = 76 - 3*2 = 70
  height = 136 - 3*2 = 130
```

**結果**:
- 画像は (12, 12) に配置される
- Layout に (12, 12, 52, 92) が保存される
- 抽出時に (12, 12, 52, 92) から切り取られる
- 枠線は (9, 9) から始まり、画像に重ならない

## 🔍 デバッグ方法

### 1. コンソールログを確認

スプライトシート生成時に以下のログが出力されます：

```
[Sprite Placement] <名前>: Cell(...) Content(...)
[Layout Saved] <名前>: Extract from (...)
```

抽出時に：

```
[Extracting] <名前>: from (...)
```

### 2. 座標が一致するか確認

- `[Sprite Placement]` の `Content` 座標
- `[Layout Saved]` の座標
- `[Extracting]` の座標

これらが全て同じであれば正しく動作しています。

### 3. 検証レポートを確認

`Status: ✅ VALID` が表示されることを確認してください。

## 🚀 まとめ

**座標の流れ**:
1. パッキング → Content座標を計算
2. 配置 → Content座標に画像を配置
3. 保存 → Content座標をLayoutとして保存
4. 枠線 → Content座標から±3pxの位置に描画（重ならない）
5. 抽出 → 保存されたContent座標から抽出

**保証**:
- ✅ 配置座標 = 保存座標 = 抽出座標
- ✅ 枠線はスプライトと重ならない（±3px オフセット）
- ✅ 自動検証により整合性を保証

**ファイル構成**:
- `sprite-coordinates.ts` - 座標計算ロジック
- `sprite-packer.ts` - パッキングアルゴリズム
- `sprite-layout-validator.ts` - 検証ロジック
- `texture-group-manager.ts` - スプライトシート生成・抽出

これにより、**オリジナルのスプライト領域が確実にピックされる**ことが保証されます！
