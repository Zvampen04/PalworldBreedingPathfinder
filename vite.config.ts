import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Only expose variables with VITE_ or TAURI_ENV_ prefixes to the frontend
export default defineConfig({
  plugins: [
    react({
      // modern JSX transform (no need for React import)
      jsxRuntime: "automatic",
    }),
  ],

  base: "./", // Use relative base path for Tauri builds

  clearScreen: false, // So Tauri error output is visible

  server: {
    port: 1420,
    strictPort: true,
    // Uncomment next line only if you're running Tauri dev server from a remote device:
    // host: "0.0.0.0",
    watch: {
      // Prevent Vite from watching changes in Tauri's Rust source folder
      ignored: ["**/src-tauri/**"],
    },
  },

  envPrefix: ["VITE_", "TAURI_ENV_"],

  build: {
    target: "es2020", // Ensure compatibility with Tauri's webview
    outDir: "dist",
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name]-[hash].[ext]",
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
      },
    },
  },

  // Define replacements for Tauri compatibility
  define: {
    // Replace import.meta.url with a compatible version for Tauri
    "import.meta.url": "window.location.href",
    // Ensure process.env is available but empty in browser context
    "process.env": "{}",
    // Remove global references that might cause issues
    "global": "window",
  },
}); 