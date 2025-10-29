import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Wad',
      fileName: 'index',
      formats: ['es']
    },
    rollupOptions: {
      external: []
    }
  },
  test: {
    globals: true,
    environment: 'node'
  }
});
