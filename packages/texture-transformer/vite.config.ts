import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      outDir: 'dist',
      rollupTypes: true,
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TextureTransformer',
      fileName: 'index',
      formats: ['es']
    },
    rollupOptions: {
      external: ['@google/genai', '@web-doom/wad', 'node:fs', 'node:path', 'node:buffer']
    },
    emptyOutDir: false
  },
  test: {
    globals: true,
    environment: 'node'
  }
});
