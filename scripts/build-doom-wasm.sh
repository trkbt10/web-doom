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
