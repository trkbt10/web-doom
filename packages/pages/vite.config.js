import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/web-doom/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      external: ['@resvg/resvg-js'], // Exclude Node.js native module
    },
  },
  resolve: {
    dedupe: ['three'], // Deduplicate Three.js to avoid multiple instances
  },
  optimizeDeps: {
    include: ['three', 'js-dos'], // Pre-bundle Three.js and js-dos for faster loading
    exclude: ['@resvg/resvg-js'], // Exclude Node.js native module from browser bundle
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
});
