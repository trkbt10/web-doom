# WebGL Renderer

Three.jsベースの高性能WebGLレンダラー実装

## 概要

WebGLRendererは、Three.jsを使用してGPUアクセラレーションによる高性能な3Dレンダリングを提供します。従来のCanvas 2Dベースのレイキャスティングレンダラーと比較して、大幅なパフォーマンス向上（60+ FPS）を実現します。

## 特徴

- **GPUアクセラレーション**: WebGL/Three.jsによる高速レンダリング
- **完全な3D環境**: ポリゴンベースのマップジオメトリ
- **動的照明**: セクター別のライティングシステム
- **スプライトレンダリング**: 敵、アイテム、装飾物のビルボード表示
- **パーティクルシステム**: 血しぶき、煙、火、爆発などのビジュアルエフェクト
- **カスタムシェーダー**: DOOMスタイルのレトロな見た目を実現
- **マテリアルシステム**: テクスチャとライティングの自動管理

## 使い方

### 基本的な使用例

```typescript
import { WebGLRenderer } from '@web-doom/core';
import { decode } from '@web-doom/wad';

// WADファイルの読み込み
const wadBuffer = await fetch('path/to/doom1.wad').then(r => r.arrayBuffer());
const wad = decode(wadBuffer);

// キャンバスの作成
const canvas = document.createElement('canvas');
canvas.width = 1280;
canvas.height = 720;
document.body.appendChild(canvas);

// WebGLRendererの作成
const renderer = new WebGLRenderer(canvas, wad);

// レンダラーの初期化
renderer.init({
  width: 1280,
  height: 720,
  scale: 1,
  showFPS: true
});

// マップデータのロード
import { parseMap } from '@web-doom/core';
const mapData = parseMap(wad, 'E1M1');
renderer.setMapData(mapData);

// カメラの設定
renderer.setCamera({
  position: { x: 0, y: 0, z: 41 },
  angle: 0,
  pitch: 0,
  fov: 75
});

// レンダリングは自動的に開始されます（内部アニメーションループ）
```

### レンダラーの選択

プロジェクトには3種類のレンダラーが用意されています：

1. **Canvas2DRenderer**: トップダウン2Dビュー（デバッグ用）
2. **Canvas3DRenderer**: レイキャスティングベースの3Dビュー（オリジナルDOOM風）
3. **WebGLRenderer**: Three.jsベースの高性能3Dビュー（推奨）

```typescript
// WebGLRendererの使用（推奨）
const renderer = new WebGLRenderer(canvas, wad);

// または Canvas3DRenderer（レトロスタイル）
import { Canvas3DRenderer } from '@web-doom/core';
const renderer = new Canvas3DRenderer(canvas, wad);
```

### エフェクトの使用

WebGLRendererは高度なビジュアルエフェクトをサポートしています：

```typescript
// パーティクルシステムの取得
const particleSystem = renderer.getParticleSystem();

// 血しぶきエフェクト
particleSystem?.emitBlood(
  new THREE.Vector3(x, y, z),
  new THREE.Vector3(dirX, dirY, dirZ),
  20
);

// 爆発エフェクト
particleSystem?.emitExplosion(
  new THREE.Vector3(x, y, z),
  5
);

// 煙エフェクト
particleSystem?.emitSmoke(
  new THREE.Vector3(x, y, z),
  10
);
```

## アーキテクチャ

WebGLRendererは以下のコンポーネントで構成されています：

```
webgl-renderer.ts               メインレンダラークラス
├── webgl/
│   ├── geometry-builder.ts    マップジオメトリ生成
│   ├── texture-manager-webgl.ts テクスチャ管理
│   ├── material-system.ts     マテリアルとライティング
│   ├── sprite-renderer-webgl.ts スプライトレンダリング
│   ├── particle-system-webgl.ts パーティクルエフェクト
│   └── shaders.ts             カスタムシェーダー
```

### GeometryBuilder

DOOMマップデータをThree.jsのジオメトリに変換します：

- **壁**: 垂直なクアッドメッシュ
- **床**: 水平なシェイプジオメトリ
- **天井**: 反転した床ジオメトリ

### MaterialSystem

テクスチャとライティングを管理：

- セクター別のライトレベル
- テクスチャのキャッシング
- エミッシブマテリアル（DOOM風）
- 特殊なマテリアル（空など）

### SpriteRenderer

スプライトをビルボードとして表示：

- 常にカメラに向く平面
- カスタムシェーダーでアルファテスト
- スプライトキャッシング
- 敵、アイテム、装飾物のサポート

### ParticleSystem

ビジュアルエフェクト：

- 血しぶき（BLOOD）
- 煙（SMOKE）
- 火（FIRE）
- 火花（SPARK）
- 爆発（EXPLOSION）

## パフォーマンス比較

| レンダラー | 目標FPS | 描画方法 | メモリ使用量 |
|-----------|--------|---------|------------|
| Canvas2D  | N/A    | トップダウン | 低 |
| Canvas3D  | 30-40  | レイキャスティング | 中 |
| **WebGL** | **60+** | **ポリゴン** | **中〜高** |

## カスタマイズ

### シェーダーのカスタマイズ

`webgl/shaders.ts`でカスタムシェーダーを作成・編集できます：

```typescript
import { createDoomWallMaterial } from './webgl/shaders';

const material = createDoomWallMaterial(texture, lightLevel);
// カスタムユニフォームの追加
material.uniforms.customValue = { value: 1.0 };
```

### レンダリング設定

```typescript
renderer.init({
  width: 1920,
  height: 1080,
  scale: 1,
  showFPS: true,
  showMap: false
});

// フォグの設定
const scene = renderer.getRenderTarget().scene;
scene.fog = new THREE.Fog(0x000000, 200, 2000);

// アンビエントライトの調整
// renderer内でlightオブジェクトにアクセス可能
```

## トラブルシューティング

### パフォーマンスの問題

1. **フレームレートが低い**:
   - ブラウザのハードウェアアクセラレーションを有効化
   - 解像度を下げる（scale パラメータを調整）
   - 複雑なマップでの描画距離を制限（fog設定）

2. **メモリ使用量が多い**:
   - テクスチャキャッシュをクリア
   - 使用していないスプライトを削除

### 表示の問題

1. **テクスチャが表示されない**:
   - ブラウザコンソールでエラーを確認
   - テクスチャ名が正しいか確認
   - composite textureはまだサポートされていません

2. **スプライトが表示されない**:
   - スプライト名のマッピングを確認
   - `sprite-renderer-webgl.ts`の`spriteMap`を編集

## 今後の改善予定

- [ ] Composite Texture (TEXTURE1/TEXTURE2) のサポート
- [ ] オクルージョンカリング
- [ ] Level of Detail (LOD)
- [ ] ダイナミックシャドウ
- [ ] ポストプロセッシングエフェクト
- [ ] VRサポート

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
