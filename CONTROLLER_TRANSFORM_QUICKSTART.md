# Controller Transform Quick Start

AI-powered game controller styling in 3 steps!

## 1️⃣ Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your API key
# NANOBANANA_API_KEY=your_key_here
```

Get API key: https://nanobanana.ai

## 2️⃣ Build

```bash
bun install
bun run build
```

## 3️⃣ Run Examples

### Single Style
```bash
bun run packages/game-controller/examples/transform-controller.ts "cyberpunk neon"
```

### Batch Processing
```bash
bun run packages/game-controller/examples/batch-transform.ts
```

## Output

Generated images are saved to:
```
packages/game-controller/examples/output/
```

## Try Different Styles

```bash
bun run packages/game-controller/examples/transform-controller.ts "retro arcade"
bun run packages/game-controller/examples/transform-controller.ts "steampunk brass"
bun run packages/game-controller/examples/transform-controller.ts "transparent glass RGB"
```

## More Info

- Examples: `packages/game-controller/examples/README.md`
- API Docs: `packages/game-controller/TRANSFORMER_README.md`
- Architecture: Similar to `packages/texture-transformer/`

## Programmatic Usage

```typescript
import { transformController, doomControllerSchema } from '@web-doom/game-controller';

const result = await transformController(
  doomControllerSchema,
  'cyberpunk neon style',
  process.env.NANOBANANA_API_KEY
);

console.log(result.transformed); // base64 PNG
```

## Quick Troubleshooting

❌ **API key not found**
→ Check `.env` file exists in project root

❌ **Backend not available**
→ Verify API key is valid

❌ **Module not found**
→ Run `bun run build` first
