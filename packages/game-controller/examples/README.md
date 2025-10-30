# Game Controller Transformer Examples

AI-powered controller styling examples using the game-controller transformer API.

## Setup

### 1. Copy Environment Variables

```bash
# In project root
cp .env.example .env
```

### 2. Add Your API Key

Edit `.env` and add your Nanobanana API key:

```bash
NANOBANANA_API_KEY=your_actual_api_key_here
```

Get your API key from: https://nanobanana.ai

### 3. Build the Package

```bash
# From project root
bun run build
```

## Examples

### Single Transformation

Transform a controller with a specific style:

```bash
# From project root
bun run packages/game-controller/examples/transform-controller.ts "cyberpunk neon"
```

**Other styles to try:**
```bash
bun run packages/game-controller/examples/transform-controller.ts "retro arcade"
bun run packages/game-controller/examples/transform-controller.ts "steampunk mechanical"
bun run packages/game-controller/examples/transform-controller.ts "neon pink and blue"
bun run packages/game-controller/examples/transform-controller.ts "wood grain with brass buttons"
```

**Output:**
- Original and transformed images saved to `examples/output/`
- PNG format with timestamp

### Batch Transformation

Process multiple styles at once:

```bash
# From project root
bun run packages/game-controller/examples/batch-transform.ts
```

This will generate:
- Cyberpunk landscape controller
- Retro arcade landscape controller
- Steampunk portrait controller
- Neon portrait controller

**Output:**
- All images saved to `examples/output/batch/`

## Output Files

Generated images are saved to:
```
packages/game-controller/examples/output/
├── controller-2025-01-15T12-30-45.png        # Transformed
├── controller-original-2025-01-15T12-30-45.png  # Original
└── batch/
    ├── cyberpunk-landscape.png
    ├── retro-landscape.png
    ├── steampunk-portrait.png
    └── neon-portrait.png
```

These files are git-ignored and safe to delete.

## Customizing Examples

### Adjust Transformation Strength

Edit the example files and modify the `strength` parameter:

```typescript
backendOptions: {
  nanobanana: {
    strength: 0.75,  // 0.0 = no change, 1.0 = maximum change
    steps: 30,       // More steps = better quality (but slower)
    guidanceScale: 7.5,  // Higher = more prompt adherence
  },
}
```

### Custom Prompts

Add detailed descriptions:

```typescript
const result = await client.transformControllerSchema(schema, {
  promptOverride: 'A wooden steampunk game controller with brass buttons, intricate gears, Victorian ornaments, leather grip, detailed mechanical parts, high quality, realistic rendering',
  backendOptions: {
    nanobanana: {
      strength: 0.9,
      steps: 50,
      negativePrompt: 'modern, plastic, cheap, low quality',
    },
  },
});
```

## Tips

### Rate Limiting
- Add delays between requests (already implemented in batch example)
- Typical: 2-3 seconds between transformations

### Quality Settings
- **Fast**: `steps: 20-25, strength: 0.6-0.7`
- **Balanced**: `steps: 30-35, strength: 0.75` (default)
- **Best**: `steps: 40-50, strength: 0.8-0.9`

### Style Ideas
- `"cyberpunk neon with holographic buttons"`
- `"retro arcade 80s style with CRT scanlines"`
- `"steampunk brass and wood Victorian design"`
- `"minimalist modern white and black"`
- `"transparent glass with RGB lighting"`
- `"medieval stone and iron fantasy style"`
- `"crystal clear with diamond buttons"`
- `"military tactical camouflage pattern"`

## Troubleshooting

### API Key Not Found
```
❌ Error: NANOBANANA_API_KEY not found
```
**Solution:** Ensure `.env` file exists in project root with your API key.

### Backend Not Available
```
❌ Error: Backend not available
```
**Solution:** Check your API key is valid and has credits.

### Timeout Errors
```
❌ Error: Request timeout
```
**Solution:** Increase timeout in client config:
```typescript
createImageTransformerClient({
  backend: 'nanobanana',
  apiKey,
  timeout: 120000, // 2 minutes
})
```

## Environment Variables

Supported variables in `.env`:

```bash
# Required
NANOBANANA_API_KEY=your_api_key

# Optional
NANOBANANA_ENDPOINT=https://api.nanobanana.ai/v1/i2i
```

## Next Steps

- See `TRANSFORMER_README.md` for programmatic API usage
- Check `../src/transformers/` for implementation details
- Explore adding custom backends in `nanobanana-backend.ts`
