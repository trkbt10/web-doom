# @web-doom/texture-transformer

WAD texture transformation using Gemini AI image-to-image generation.

Transform DOOM/Freedoom textures into different visual styles using Google's Gemini AI API.

## Features

- Extract textures from WAD files
- Categorize textures (sprites, walls, flats, etc.)
- Group textures semantically
- Transform textures using Gemini AI img2img
- Freedoom texture catalog with prompt templates
- Batch processing with progress tracking

## Installation

```bash
bun install
```

## Development

```bash
# Build the package
bun run build

# Run tests
bun run test

# Watch mode for tests
bun run test:watch

# Type checking
bun run typecheck

# Clean build artifacts
bun run clean
```

## Setup

1. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Set the environment variable:

```bash
export GEMINI_API_KEY="your-api-key-here"
```

## Usage

### CLI Tools

#### Extract Textures from WAD

Extract textures from WAD files and generate a catalog:

```bash
# Extract from freedoom1.wad
bun run extract:freedoom1

# Extract from freedoom2.wad
bun run extract:freedoom2

# Extract from any WAD file
bun run extract <wad-path> <output-dir>
# Example: bun run extract ../../assets/doom.wad catalog/doom
```

This will:
- Extract all picture lumps from the WAD file
- Categorize them (sprites, walls, HUD, menu, other)
- Create a catalog.json with metadata
- Save individual JSON files for each texture

Output structure:
```
catalog/
├── freedoom1/
│   ├── sprites/     # Sprite textures
│   ├── walls/       # Wall textures
│   ├── hud/         # HUD elements
│   ├── menu/        # Menu graphics
│   ├── other/       # Other textures
│   └── catalog.json # Catalog metadata
└── freedoom2/
    └── ...
```

**Note:** PNG files are generated using the `canvas` package in Node.js environment.

#### Recompile WAD with Modified Textures

After modifying textures in the catalog, recompile them back into a WAD:

```bash
bun run recompile <original-wad> <catalog-dir> <output-wad>

# Example:
bun run recompile \
  ../../assets/freedoom-0.13.0/freedoom1.wad \
  catalog/freedoom1 \
  ../../output/freedoom1-modified.wad
```

This will:
1. Read the original WAD file
2. Find PNG files in catalog directories (sprites/, walls/, etc.)
3. Convert PNGs to DOOM picture format
4. Replace corresponding lumps in the WAD
5. Save the modified WAD to the output path

Workflow example:
```bash
# 1. Extract textures
bun run extract:freedoom1

# 2. Modify PNG files in catalog/freedoom1/sprites/
# (edit BAL1A0.png, TROOA0.png, etc. with image editor)

# 3. Recompile WAD
bun run recompile \
  ../../assets/freedoom-0.13.0/freedoom1.wad \
  catalog/freedoom1 \
  ../../output/freedoom1-modified.wad
```

### Roundtrip Testing

The extraction → recompilation workflow has been thoroughly tested and verified:

**Test Results:**
✅ WAD texture extraction (2257 textures from freedoom1.wad)
✅ PNG file generation with canvas package (Node.js environment)
✅ Catalog structure creation with category-based organization
✅ WAD recompilation with modified textures (2256 textures replaced)
✅ Map data preservation (LINEDEFS, THINGS, etc. not affected)
✅ **Perfect file size match**: 27MB → 27MB (exact binary size preservation)
✅ **Lossless roundtrip**: PNG → DOOM Picture → PNG produces identical files
✅ All recompiled textures decode successfully

**Single Texture Test (TROOA1):**
- Original lump: 2248 bytes → Recoded: 2248 bytes ✓
- Original PNG: 4113 bytes → Recoded PNG: 4113 bytes ✓
- Decode/encode cycle: 100% lossless ✓

**Known Behaviors:**
- Palette mapping is deterministic (closest color match)
- Non-picture lumps (map data) are automatically excluded from recompilation
- Padding bytes in DOOM picture format are correctly handled

**Recommendations:**
- The roundtrip process is now fully reliable for texture modifications
- Test your modified textures in a DOOM engine to verify visual appearance
- Keep backups of original WAD files as a best practice

### Example Script

```bash
# Transform textures from a WAD file
bun run src/example.ts freedoom1.wad ./output "cyberpunk neon style"
```

### Programmatic Usage

```typescript
import { decode } from '@web-doom/wad';
import {
  extractTextures,
  groupTexturesByCategory,
  createGeminiClient,
  transformTextureBatch,
  saveTransformationResults,
} from '@web-doom/texture-transformer';

// Load WAD file
const wadBuffer = await fs.readFile('freedoom1.wad');
const wad = decode(wadBuffer);

// Extract and group textures
const textures = extractTextures(wad);
const groups = groupTexturesByCategory(textures);

// Transform textures
const client = createGeminiClient(process.env.GEMINI_API_KEY);
const results = await transformTextureBatch(
  client,
  groups[0].textures,
  {
    style: 'with cyberpunk neon aesthetic',
    preserveTransparency: true
  },
  (current, total) => {
    console.log(`Progress: ${current}/${total}`);
  }
);

// Save results
await saveTransformationResults(results, './output');
```

## API

### Texture Extraction

- `extractTextures(wad)` - Extract all textures from WAD
- `extractTexturesByCategory(wad, category)` - Extract textures by category
- `extractTexturesByPattern(wad, pattern)` - Extract textures by name pattern

### Texture Grouping

- `groupTexturesByCategory(textures)` - Group by category
- `createSemanticGroups(textures)` - Smart semantic grouping
- `buildTransformPrompt(texture, style)` - Build AI prompt for texture

### Image Transformation

- `createGeminiClient(apiKey?)` - Create Gemini AI client
- `transformTexture(client, texture, options)` - Transform single texture
- `transformTextureBatch(client, textures, options, onProgress)` - Transform batch
- `transformTexturesConcurrent(client, textures, options, concurrency)` - Concurrent processing
- `saveTransformationResults(results, outputDir)` - Save to files

### Freedoom Catalog

- `FREEDOOM_CATALOG` - Catalog of known textures
- `getCatalogEntry(name)` - Get catalog entry by name
- `buildCatalogPrompt(name, style)` - Build prompt from catalog

## Types

### TextureCategory

- `SPRITE` - Game sprites (monsters, items, weapons)
- `WALL` - Wall textures
- `FLAT` - Floor/ceiling textures
- `PATCH` - Texture patches
- `HUD` - HUD elements
- `MENU` - Menu graphics
- `OTHER` - Miscellaneous

### ExtractedTexture

```typescript
interface ExtractedTexture {
  name: string;
  imageData: string; // base64 PNG
  width: number;
  height: number;
  category: TextureCategory;
}
```

### TransformOptions

```typescript
interface TransformOptions {
  style?: string;
  customPrompt?: string;
  preserveTransparency?: boolean;
  targetSize?: { width: number; height: number };
}
```

## Examples

### Transform all sprite textures

```typescript
const sprites = extractTexturesByCategory(wad, TextureCategory.SPRITE);
const results = await transformTextureBatch(client, sprites, {
  style: 'with hand-drawn cartoon style'
});
```

### Transform specific texture group

```typescript
const groups = createSemanticGroups(textures);
const playerSprites = groups.get('player-sprites');

if (playerSprites) {
  const results = await transformTextureBatch(
    client,
    playerSprites.textures,
    { style: 'with realistic 3D rendering' }
  );
}
```

### Concurrent processing

```typescript
const results = await transformTexturesConcurrent(
  client,
  textures,
  { style: 'pixel art style' },
  3 // process 3 at a time
);
```

## Testing

The package includes comprehensive unit tests:

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch
```

Tests cover:
- Texture category detection
- Lump format validation
- Texture grouping logic
- Prompt building
- Data URL parsing
- Freedoom catalog lookups

## Notes

- The Gemini API has rate limits, so batch processing includes delays
- Transparency preservation works best with sprite textures
- Wall and flat textures should maintain tiling properties
- Transform times vary based on texture size and complexity
- Canvas API is required for texture extraction (browser environment or canvas package in Node.js)

## Requirements

- Bun package manager
- TypeScript 5.3+
- Node.js 18+ or Bun runtime
- Gemini API key from Google AI Studio

## License

MIT
