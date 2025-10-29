import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'WebDoom',
      fileName: 'index',
      formats: ['es']
    },
    rollupOptions: {
      external: ['@web-doom/wad-viewer']
    }
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
});
