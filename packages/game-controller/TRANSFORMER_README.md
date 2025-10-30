# Game Controller Image Transformer

AI-powered styling system for game controller images, inspired by texture-transformer's architecture.

## Features

- 🎨 **AI-Powered Styling**: Transform controller appearance with custom styles
- 🔄 **Multiple Backends**: Support for Nanobanana, Gemini (future), and more
- 🖼️ **Automatic Conversion**: SVG → PNG conversion handled automatically
- 🎮 **Schema-Based**: Works directly with ControllerSchema objects
- 🔌 **Modular**: Easy to add new AI backends

## Installation

```bash
bun install @web-doom/game-controller
```

## Quick Start

```typescript
import {
  doomControllerSchema,
  transformController,
} from '@web-doom/game-controller';

// Transform with a specific style
const result = await transformController(
  doomControllerSchema,
  'cyberpunk neon style',
  'your-api-key'
);

console.log('Original:', result.original.imageData);
console.log('Transformed:', result.transformed);
console.log('Prompt used:', result.prompt);
```

## Advanced Usage

### Using ImageTransformerClient

```typescript
import {
  createImageTransformerClient,
  doomControllerSchema,
} from '@web-doom/game-controller';

// Create client
const client = createImageTransformerClient({
  backend: 'nanobanana',
  apiKey: process.env.NANOBANANA_API_KEY,
  timeout: 60000,
});

// Check availability
if (client.isAvailable()) {
  console.log('Backend:', client.getBackendName());
}

// Transform with custom options
const result = await client.transformControllerSchema(doomControllerSchema, {
  style: 'retro arcade with CRT effects',
  customPrompt: 'Add scanlines and vintage colors',
  backendOptions: {
    nanobanana: {
      strength: 0.8,
      steps: 40,
      guidanceScale: 8.0,
      seed: 42,
      negativePrompt: 'modern, flat design, minimalist',
    },
  },
});

if (result.status === 'success') {
  // Use transformed image
  console.log('Transformed successfully!');
  console.log('Metadata:', result.metadata);
} else {
  console.error('Transformation failed:', result.error);
}
```

### Converting Images

```typescript
import {
  generateControllerImage,
  svgToPng,
  doomControllerSchema,
} from '@web-doom/game-controller';

// Generate SVG from schema
const svgDataUrl = generateControllerImage(doomControllerSchema);

// Convert to PNG
const pngDataUrl = await svgToPng(
  svgDataUrl,
  doomControllerSchema.width,
  doomControllerSchema.height,
  2 // 2x scale for better quality
);

console.log('PNG image ready for AI processing');
```

### Using Backend Directly

```typescript
import {
  createNanobananaBackend,
  generateControllerImage,
  svgToPng,
  doomControllerSchema,
} from '@web-doom/game-controller';

// Create backend
const backend = createNanobananaBackend({
  apiKey: process.env.NANOBANANA_API_KEY,
  defaultModel: 'nanobanana-i2i-v1',
  timeout: 60000,
});

// Prepare image
const svgDataUrl = generateControllerImage(doomControllerSchema);
const pngDataUrl = await svgToPng(
  svgDataUrl,
  doomControllerSchema.width,
  doomControllerSchema.height,
  2
);

const controllerImage = {
  schema: doomControllerSchema,
  imageData: pngDataUrl,
  format: 'png' as const,
  width: doomControllerSchema.width * 2,
  height: doomControllerSchema.height * 2,
};

// Transform
const result = await backend.transform(controllerImage, {
  style: 'steampunk mechanical',
});
```

## Configuration

### Environment Variables

```bash
# Nanobanana API
NANOBANANA_API_KEY=your_api_key_here
NANOBANANA_ENDPOINT=https://api.nanobanana.ai/v1/i2i
```

### Backend Options

#### Nanobanana

```typescript
interface NanobananaTransformOptions {
  modelId?: string;        // Model ID (default: 'nanobanana-i2i-v1')
  strength?: number;       // 0-1, how much to transform (default: 0.75)
  steps?: number;          // Inference steps (default: 30)
  guidanceScale?: number;  // Prompt adherence (default: 7.5)
  seed?: number;           // Random seed for reproducibility
  negativePrompt?: string; // What to avoid
}
```

## API Reference

### Main Functions

- `transformController(schema, style, apiKey?)` - Quick transformation
- `createImageTransformerClient(config)` - Create client instance
- `buildControllerPrompt(schema, style?)` - Build AI prompt

### Classes

- `ImageTransformerClient` - Main client interface
- `NanobananaBackend` - Nanobanana backend implementation

### Utilities

- `svgToPng(svgDataUrl, width, height, scale?)` - Convert SVG to PNG
- `extractBase64(dataUrl)` - Extract base64 from data URL
- `getImageDimensions(dataUrl)` - Get image dimensions
- `isValidImageDataUrl(dataUrl)` - Validate data URL

## Examples

### Cyberpunk Style

```typescript
const result = await transformController(
  doomControllerSchema,
  'cyberpunk with neon lights, futuristic',
  apiKey
);
```

### Retro Arcade Style

```typescript
const client = createImageTransformerClient({
  backend: 'nanobanana',
  apiKey,
});

const result = await client.transformControllerSchema(doomControllerSchema, {
  style: 'retro arcade, 80s aesthetic',
  customPrompt: 'Add CRT scanlines and vintage color grading',
  backendOptions: {
    nanobanana: {
      strength: 0.85,
      negativePrompt: 'modern, sleek, minimalist',
    },
  },
});
```

### Custom Theme

```typescript
const result = await client.transformControllerSchema(doomControllerSchema, {
  promptOverride:
    'A wooden steampunk game controller with brass buttons, gears, and Victorian ornaments. Detailed, realistic, high quality.',
  backendOptions: {
    nanobanana: {
      strength: 0.9,
      steps: 50,
      guidanceScale: 9.0,
    },
  },
});
```

## Architecture

This module is inspired by `@web-doom/texture-transformer` and follows the same modular architecture:

```
transformers/
├── types.ts                    # Type definitions
├── image-converter.ts          # SVG ↔ PNG utilities
├── nanobanana-backend.ts       # Nanobanana implementation
├── image-transformer-client.ts # Unified client
└── index.ts                    # Exports
```

### Adding New Backends

1. Implement `ImageTransformerBackend` interface
2. Add backend-specific options to types
3. Register in `ImageTransformerClient`

```typescript
class MyCustomBackend implements ImageTransformerBackend {
  readonly name = 'my-backend';

  isAvailable(): boolean {
    // Check if API key is configured
  }

  async transform(
    image: ControllerImage,
    options: ControllerTransformOptions
  ): Promise<ControllerTransformResult> {
    // Implement transformation logic
  }
}
```

## License

MIT
