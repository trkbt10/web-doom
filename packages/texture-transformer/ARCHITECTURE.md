# texture-transformer Architecture

## Overview

This document describes the architecture and organization of the `@web-doom/texture-transformer` package.

## Folder Structure

```
packages/texture-transformer/src/
├── core/                     # Core type definitions and interfaces
│   └── types.ts
├── extractors/              # WAD texture extraction
│   └── texture-extractor.ts
├── groupers/                # Texture grouping and prompt generation
│   └── texture-grouper.ts
├── transformers/            # AI-powered image transformations
│   ├── gemini-client.ts        # Gemini AI transformer
│   ├── nanobanana-client.ts    # Nanobanana i2i transformer
│   ├── transformer-pipeline.ts  # Unified transformation pipeline
│   └── batch-processor.ts      # Batch processing orchestration
├── catalog/                 # Texture metadata catalogs
│   └── freedoom-catalog.ts
└── index.ts                 # Public API exports
```

## Module Dependencies

```
┌─────────────────────────────────────────────────────────┐
│                      core/types.ts                       │
│  • All type definitions                                 │
│  • No dependencies                                      │
└────────────┬────────────────────────────────────────────┘
             │
             ├─────────────────────────────────────────────┐
             │                                             │
             ▼                                             ▼
┌────────────────────────┐                    ┌────────────────────────┐
│ extractors/            │                    │ catalog/               │
│  texture-extractor.ts  │                    │  freedoom-catalog.ts   │
│  • Uses: core/types    │                    │  • Uses: core/types    │
│  • Depends on: @wad    │                    │  • No other deps       │
└────────┬───────────────┘                    └────────────────────────┘
         │
         ▼
┌────────────────────────┐
│ groupers/              │
│  texture-grouper.ts    │
│  • Uses: core/types    │
│  • No other deps       │
└────────┬───────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│                   transformers/                          │
│                                                          │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │ gemini-client.ts │      │nanobanana-client │        │
│  │ • Gemini AI i2i  │      │ • Nanobanana i2i │        │
│  │ • Uses: groupers │      │ • Uses: groupers │        │
│  └──────────────────┘      └──────────────────┘        │
│            │                        │                   │
│            └────────────┬───────────┘                   │
│                         ▼                               │
│          ┌────────────────────────────┐                 │
│          │ transformer-pipeline.ts    │                 │
│          │ • Unified API              │                 │
│          │ • Selects transformer      │                 │
│          └──────────┬─────────────────┘                 │
│                     ▼                                   │
│          ┌────────────────────────────┐                 │
│          │ batch-processor.ts         │                 │
│          │ • Orchestration            │                 │
│          │ • Statistics tracking      │                 │
│          └────────────────────────────┘                 │
└─────────────────────────────────────────────────────────┘
```

## Module Descriptions

### core/types.ts

**Purpose**: Define all TypeScript types and interfaces

**Exports**:
- `ExtractedTexture`: Texture data with metadata
- `TextureCategory`: Enum for texture categories
- `TextureGroup`: Group of related textures
- `TransformationResult`: Result of AI transformation
- `TransformOptions`: Options for transformation
- `NanobananaOptions`: Nanobanana-specific options
- `ImageTransformer`: Interface for transformer clients
- `BatchTransformOptions`: Options for batch processing
- `GroupTransformConfig`: Configuration for group transformation

**Dependencies**: None

### extractors/texture-extractor.ts

**Purpose**: Extract textures from WAD files

**Key Functions**:
- `extractTextures(wad)`: Extract all textures
- `extractTexturesByCategory(wad, category)`: Filter by category
- `determineCategory(lumpName)`: Categorize texture by name
- `pictureToBase64PNG(picture)`: Convert to PNG format

**Dependencies**:
- `core/types`
- `@web-doom/wad`

### groupers/texture-grouper.ts

**Purpose**: Group textures and generate AI prompts

**Key Functions**:
- `groupTexturesByCategory(textures)`: Group by category
- `createSemanticGroups(textures)`: Smart grouping (player, monsters, weapons, etc.)
- `buildTransformPrompt(texture, style)`: Generate prompt for single texture
- `buildBatchPrompt(textures, style)`: Generate prompt for batch

**Dependencies**:
- `core/types`

### transformers/gemini-client.ts

**Purpose**: Gemini AI image transformation

**Key Classes/Functions**:
- `GeminiClient`: Implements `ImageTransformer` interface
- `createGeminiClient(config)`: Factory function
- `prepareImageForGemini(dataUrl)`: Convert image format

**Dependencies**:
- `core/types`
- `groupers/texture-grouper`
- `@google/genai`

### transformers/nanobanana-client.ts

**Purpose**: Nanobanana i2i image transformation

**Key Classes/Functions**:
- `NanobananaClient`: Implements `ImageTransformer` interface
- `createNanobananaClient(config)`: Factory function

**Features**:
- Custom prompt support
- Negative prompts
- Configurable strength, steps, guidance scale
- Reproducible seeds

**Dependencies**:
- `core/types`
- `groupers/texture-grouper`

### transformers/transformer-pipeline.ts

**Purpose**: Unified API for both Gemini and Nanobanana

**Key Classes/Functions**:
- `TransformerPipeline`: Main pipeline class
- `createTransformerPipeline(config)`: Factory function

**Features**:
- Select transformer at runtime
- Transform single/batch/group textures
- Save results to organized directories

**Dependencies**:
- `core/types`
- `transformers/gemini-client`
- `transformers/nanobanana-client`

### transformers/batch-processor.ts

**Purpose**: Batch processing with statistics and progress tracking

**Key Classes/Functions**:
- `BatchProcessor`: Main batch processing class
- `createBatchProcessor(config)`: Factory function

**Features**:
- Process multiple groups with different configurations
- Track statistics (success/failed/time)
- Progress callbacks
- Organized output

**Dependencies**:
- `core/types`
- `transformers/transformer-pipeline`

### catalog/freedoom-catalog.ts

**Purpose**: Metadata catalog for Freedoom/DOOM textures

**Key Exports**:
- `FREEDOOM_CATALOG`: Catalog data
- `getCatalogEntry(name)`: Lookup entry
- `buildCatalogPrompt(name, style)`: Generate prompt from catalog

**Dependencies**:
- `core/types`

## Data Flow

### Simple Transformation Flow

```
WAD File
   ↓
extractTextures()
   ↓
ExtractedTexture[]
   ↓
groupTexturesByCategory() or createSemanticGroups()
   ↓
TextureGroup[]
   ↓
createTransformerPipeline()
   ↓
transformGroup() → Select GeminiClient or NanobananaClient
   ↓
buildTransformPrompt() → Generate AI prompt
   ↓
API Call (Gemini or Nanobanana)
   ↓
TransformationResult[]
   ↓
saveResults()
   ↓
PNG files
```

### Batch Processing Flow

```
WAD File
   ↓
extractTextures()
   ↓
createSemanticGroups()
   ↓
GroupTransformConfig[] (custom config per group)
   ↓
createBatchProcessor()
   ↓
processGroupsWithConfig()
   ├─ Progress tracking
   ├─ Statistics collection
   └─ Concurrent processing
   ↓
Map<groupName, TransformationResult[]>
   ↓
saveResults()
   ↓
Organized output by group
```

## Design Principles

### 1. Separation of Concerns

Each module has a single, well-defined responsibility:
- **extractors**: WAD file I/O
- **groupers**: Organization and prompts
- **transformers**: AI API calls
- **catalog**: Metadata

### 2. Dependency Direction

Dependencies flow in one direction:
```
core → extractors → groupers → transformers
```

No circular dependencies exist.

### 3. Interface-Based Design

All transformers implement the `ImageTransformer` interface, allowing easy swapping between Gemini and Nanobanana.

### 4. Factory Functions

Each major component has a factory function:
- `createGeminiClient()`
- `createNanobananaClient()`
- `createTransformerPipeline()`
- `createBatchProcessor()`

This provides a clean API and encapsulates initialization logic.

### 5. Extensibility

Adding a new transformer requires:
1. Implement `ImageTransformer` interface
2. Add to `TransformerPipeline`
3. Update type definitions

No changes needed in extractors, groupers, or batch processor.

## Testing Strategy

Each module has corresponding test files:
- `texture-extractor.test.ts`
- `texture-grouper.test.ts`
- `image-transformer.test.ts` (legacy, needs update)
- `freedoom-catalog.test.ts`

Tests focus on:
- Pure functions (category detection, prompt building)
- Data transformations
- Type safety

## Future Enhancements

Possible extensions following the current architecture:

1. **New Transformers**: Add Stable Diffusion, DALL-E, etc.
2. **Smart Grouping**: ML-based texture similarity grouping
3. **Quality Metrics**: Compare original vs. transformed
4. **Caching**: Cache API results to avoid redundant calls
5. **WAD Integration**: Directly replace textures in WAD files
