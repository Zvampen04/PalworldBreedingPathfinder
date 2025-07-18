import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Use relative base path for Tauri builds to ensure assets load correctly
  base: '',

  // Ensure proper asset handling for Tauri
  build: {
    // Tauri uses Chromium on Windows and WebKit on macOS and Linux
    // @ts-expect-error process is a nodejs global
    target: process.env.TAURI_ENV_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
    // don't minify for debug builds
    // @ts-expect-error process is a nodejs global
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    // produce sourcemaps for debug builds
    // @ts-expect-error process is a nodejs global
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
    // Ensure assets are properly handled
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
});
