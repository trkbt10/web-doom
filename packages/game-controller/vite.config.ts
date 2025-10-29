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
      name: 'GameController',
      fileName: 'index',
      formats: ['es']
    },
    rollupOptions: {
      external: ['react', 'react/jsx-runtime']
    },
    emptyOutDir: false
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
});
