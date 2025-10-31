// vite.config.ts
import { defineConfig } from "file:///Users/terukichi/Workspaces/trkbt10/web-doom/node_modules/vite/dist/node/index.js";
import { resolve } from "path";
import dts from "file:///Users/terukichi/Workspaces/trkbt10/web-doom/node_modules/vite-plugin-dts/dist/index.mjs";
var __vite_injected_original_dirname = "/Users/terukichi/Workspaces/trkbt10/web-doom/packages/texture-transformer";
var vite_config_default = defineConfig({
  plugins: [
    dts({
      outDir: "dist",
      rollupTypes: true
    })
  ],
  build: {
    lib: {
      entry: resolve(__vite_injected_original_dirname, "src/index.ts"),
      name: "TextureTransformer",
      fileName: "index",
      formats: ["es"]
    },
    rollupOptions: {
      external: ["@google/genai", "@web-doom/wad", "node:fs", "node:path", "node:buffer"]
    },
    emptyOutDir: false
  },
  test: {
    globals: true,
    environment: "node"
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdGVydWtpY2hpL1dvcmtzcGFjZXMvdHJrYnQxMC93ZWItZG9vbS9wYWNrYWdlcy90ZXh0dXJlLXRyYW5zZm9ybWVyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvdGVydWtpY2hpL1dvcmtzcGFjZXMvdHJrYnQxMC93ZWItZG9vbS9wYWNrYWdlcy90ZXh0dXJlLXRyYW5zZm9ybWVyL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy90ZXJ1a2ljaGkvV29ya3NwYWNlcy90cmtidDEwL3dlYi1kb29tL3BhY2thZ2VzL3RleHR1cmUtdHJhbnNmb3JtZXIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJztcbmltcG9ydCBkdHMgZnJvbSAndml0ZS1wbHVnaW4tZHRzJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIGR0cyh7XG4gICAgICBvdXREaXI6ICdkaXN0JyxcbiAgICAgIHJvbGx1cFR5cGVzOiB0cnVlLFxuICAgIH0pXG4gIF0sXG4gIGJ1aWxkOiB7XG4gICAgbGliOiB7XG4gICAgICBlbnRyeTogcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvaW5kZXgudHMnKSxcbiAgICAgIG5hbWU6ICdUZXh0dXJlVHJhbnNmb3JtZXInLFxuICAgICAgZmlsZU5hbWU6ICdpbmRleCcsXG4gICAgICBmb3JtYXRzOiBbJ2VzJ11cbiAgICB9LFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGV4dGVybmFsOiBbJ0Bnb29nbGUvZ2VuYWknLCAnQHdlYi1kb29tL3dhZCcsICdub2RlOmZzJywgJ25vZGU6cGF0aCcsICdub2RlOmJ1ZmZlciddXG4gICAgfSxcbiAgICBlbXB0eU91dERpcjogZmFsc2VcbiAgfSxcbiAgdGVzdDoge1xuICAgIGdsb2JhbHM6IHRydWUsXG4gICAgZW52aXJvbm1lbnQ6ICdub2RlJ1xuICB9XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNlksU0FBUyxvQkFBb0I7QUFDMWEsU0FBUyxlQUFlO0FBQ3hCLE9BQU8sU0FBUztBQUZoQixJQUFNLG1DQUFtQztBQUl6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxJQUFJO0FBQUEsTUFDRixRQUFRO0FBQUEsTUFDUixhQUFhO0FBQUEsSUFDZixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsS0FBSztBQUFBLE1BQ0gsT0FBTyxRQUFRLGtDQUFXLGNBQWM7QUFBQSxNQUN4QyxNQUFNO0FBQUEsTUFDTixVQUFVO0FBQUEsTUFDVixTQUFTLENBQUMsSUFBSTtBQUFBLElBQ2hCO0FBQUEsSUFDQSxlQUFlO0FBQUEsTUFDYixVQUFVLENBQUMsaUJBQWlCLGlCQUFpQixXQUFXLGFBQWEsYUFBYTtBQUFBLElBQ3BGO0FBQUEsSUFDQSxhQUFhO0FBQUEsRUFDZjtBQUFBLEVBQ0EsTUFBTTtBQUFBLElBQ0osU0FBUztBQUFBLElBQ1QsYUFBYTtBQUFBLEVBQ2Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
