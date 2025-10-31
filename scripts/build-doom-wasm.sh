#!/bin/bash
set -e

echo "======================================"
echo "DOOM WASM Build Script"
echo "======================================"
echo ""

# Check if Emscripten is installed
if ! command -v emcc &> /dev/null; then
    echo "Error: Emscripten is not installed"
    echo ""
    echo "Please install Emscripten first:"
    echo "  brew install emscripten"
    echo "  brew install automake"
    echo "  brew install sdl2 sdl2_mixer sdl2_net"
    echo ""
    exit 1
fi

echo "✓ Emscripten is installed"
emcc --version | head -n 1
echo ""

# Set up directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_ROOT/build/doom-wasm"
PUBLIC_DIR="$PROJECT_ROOT/packages/pages/public/doom"

echo "Project root: $PROJECT_ROOT"
echo "Build directory: $BUILD_DIR"
echo "Public directory: $PUBLIC_DIR"
echo ""

# Clone doom-wasm if not exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "Cloning doom-wasm..."
    mkdir -p "$(dirname "$BUILD_DIR")"
    git clone https://github.com/cloudflare/doom-wasm.git "$BUILD_DIR"
    echo "✓ Cloned doom-wasm"
else
    echo "✓ doom-wasm already exists"
fi
echo ""

# Navigate to doom-wasm directory
cd "$BUILD_DIR"

# Clean previous build
echo "Cleaning previous build..."
./scripts/clean.sh
echo "✓ Clean complete"
echo ""

# Patch default.cfg to optimize for controller input
echo "Patching default.cfg for controller input..."
if [ -f "src/default.cfg" ]; then
    # Use WebGL renderer (software renderer is not fully supported)
    sed -i '' 's/force_software_renderer[[:space:]]*1/force_software_renderer       0/' "src/default.cfg"

    # Disable joystick to avoid double input (SDL joystick + web UI)
    sed -i '' 's/use_mouse[[:space:]]*[01]/use_mouse                     0/' "src/default.cfg"
    sed -i '' 's/use_joystick[[:space:]]*[01]/use_joystick                  0/' "src/default.cfg"

    # Map keys to arrow keys (SDL scancodes)
    # key_up: 82 (ArrowUp), key_down: 81 (ArrowDown)
    # key_left: 80 (ArrowLeft), key_right: 79 (ArrowRight)
    sed -i '' 's/key_right[[:space:]]*[0-9]*/key_right                     79/' "src/default.cfg"
    sed -i '' 's/key_left[[:space:]]*[0-9]*/key_left                      80/' "src/default.cfg"
    sed -i '' 's/key_up[[:space:]]*[0-9]*/key_up                        82/' "src/default.cfg"
    sed -i '' 's/key_down[[:space:]]*[0-9]*/key_down                      81/' "src/default.cfg"

    # Add novert and always_run for proper movement (add after fullscreen line)
    if ! grep -q "^novert" "src/default.cfg"; then
        sed -i '' '/^fullscreen/a\
novert                        1\
always_run                    1' "src/default.cfg"
    fi

    # Enforce integer scaling to prevent smoothing artifacts
    if grep -q "^integer_scaling" "src/default.cfg"; then
        sed -i '' 's/integer_scaling[[:space:]]*[0-9]*/integer_scaling               1/' "src/default.cfg"
    else
        printf 'integer_scaling               1\n' >> "src/default.cfg"
    fi

    # Align key bindings with our UI mappings (SDL scancodes)
    # Arrows
    sed -i '' 's/^key_up[[:space:]]*[0-9]*/key_up                        82/' "src/default.cfg" || true
    sed -i '' 's/^key_down[[:space:]]*[0-9]*/key_down                      81/' "src/default.cfg" || true
    sed -i '' 's/^key_left[[:space:]]*[0-9]*/key_left                      80/' "src/default.cfg" || true
    sed -i '' 's/^key_right[[:space:]]*[0-9]*/key_right                     79/' "src/default.cfg" || true
    # Actions
    if grep -q "^key_fire" "src/default.cfg"; then
      sed -i '' 's/^key_fire[[:space:]]*[0-9]*/key_fire                      224/' "src/default.cfg"
    else
      printf 'key_fire                      224\n' >> "src/default.cfg"
    fi
    if grep -q "^key_use" "src/default.cfg"; then
      sed -i '' 's/^key_use[[:space:]]*[0-9]*/key_use                       44/' "src/default.cfg"
    else
      printf 'key_use                       44\n' >> "src/default.cfg"
    fi
    # Strafes (direct keys)
    if grep -q "^key_strafeleft" "src/default.cfg"; then
      sed -i '' 's/^key_strafeleft[[:space:]]*[0-9]*/key_strafeleft                54/' "src/default.cfg"
    else
      printf 'key_strafeleft                54\n' >> "src/default.cfg"
    fi
    if grep -q "^key_straferight" "src/default.cfg"; then
      sed -i '' 's/^key_straferight[[:space:]]*[0-9]*/key_straferight               55/' "src/default.cfg"
    else
      printf 'key_straferight               55\n' >> "src/default.cfg"
    fi

    echo "✓ Controller optimizations applied to default.cfg"
else
    echo "Warning: default.cfg not found"
fi
echo ""

# Patch i_video.c to avoid linear filtering on final blit (prevents ghosting)
echo "Patching i_video.c to use NEAREST filtering for final upscale..."
if [ -f "src/i_video.c" ]; then
  # Replace the second SDL_HINT_RENDER_SCALE_QUALITY to 'nearest'
  # (the first occurrence is already 'nearest' for the intermediate texture)
  if grep -q 'SDL_SetHint(SDL_HINT_RENDER_SCALE_QUALITY, "linear")' "src/i_video.c"; then
    sed -i '' 's/SDL_SetHint(SDL_HINT_RENDER_SCALE_QUALITY, "linear")/SDL_SetHint(SDL_HINT_RENDER_SCALE_QUALITY, "nearest")/' "src/i_video.c"
    echo "✓ Updated scale quality hint to nearest"
  else
    echo "ℹ️  No linear scale hint found to replace (already nearest?)"
  fi
else
  echo "Warning: src/i_video.c not found; skipping renderer patch"
fi
echo ""

# Build
echo "Building DOOM WASM (this may take several minutes)..."
./scripts/build.sh
echo "✓ Build complete"
echo ""

# Check if doom1.wad exists in src
if [ ! -f "src/doom1.wad" ]; then
    echo "Warning: doom1.wad not found in src/"
    echo "Please download DOOM Shareware WAD and place it at:"
    echo "  $BUILD_DIR/src/doom1.wad"
    echo ""
    echo "You can download it from:"
    echo "  https://distro.ibiblio.org/slitaz/sources/packages/d/doom1.wad"
    echo ""
fi

# Create public directory if not exists
mkdir -p "$PUBLIC_DIR"

# Copy built files
echo "Copying built files to public directory..."
cp "$BUILD_DIR/src/websockets-doom.js" "$PUBLIC_DIR/"
cp "$BUILD_DIR/src/websockets-doom.wasm" "$PUBLIC_DIR/"
cp "$BUILD_DIR/src/default.cfg" "$PUBLIC_DIR/"

# Copy doom1.wad if exists
if [ -f "$BUILD_DIR/src/doom1.wad" ]; then
    cp "$BUILD_DIR/src/doom1.wad" "$PUBLIC_DIR/"
    echo "✓ Copied doom1.wad"
fi

echo "✓ Files copied to $PUBLIC_DIR"
echo ""

# List copied files
echo "Built files:"
ls -lh "$PUBLIC_DIR"
echo ""

echo "======================================"
echo "Build Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. If you haven't already, download doom1.wad:"
echo "   curl -o $BUILD_DIR/src/doom1.wad https://distro.ibiblio.org/slitaz/sources/packages/d/doom1.wad"
echo "   Then run this script again to copy it"
echo ""
echo "2. The DOOM Player page should now work when you run:"
echo "   bun run --filter @web-doom/pages dev"
echo ""
