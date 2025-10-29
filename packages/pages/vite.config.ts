import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/web-doom/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'wad-viewer': resolve(__dirname, 'wad-viewer.html'),
        'web-doom': resolve(__dirname, 'web-doom.html')
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
});
