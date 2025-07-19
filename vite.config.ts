import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Use classic JSX transform for better compatibility with React 18
      jsxRuntime: 'classic',
    }),
    // Custom plugin to handle import.meta in dynamic imports
    {
      name: 'fix-import-meta',
      transform(code, id) {
        if (id.indexOf('node_modules') !== -1) return;
        
        // Replace import.meta.url in dynamic imports with a safe alternative
        return code.replace(
          /import\.meta\.url/g,
          'window.location.href'
        );
      }
    }
  ],

  // Use relative base path for Tauri builds to ensure assets load correctly
  base: './',

  // Define global variables to replace Node.js globals
  define: {
    // Replace Node.js globals with browser-compatible versions
    'process.env': '{}',
    'process.platform': '"browser"',
    'process.version': '"v16.0.0"',
    'process.versions': '{}',
    'process.browser': 'true',
    'process.node': 'false',
    '__dirname': '""',
    '__filename': '""',
    'global': 'window',
    'Buffer': 'undefined',
    'setImmediate': 'undefined',
    'clearImmediate': 'undefined',
    // Handle import.meta for Tauri compatibility
    'import.meta.env.MODE': '"production"',
    'import.meta.env.BASE_URL': '"/"',
    'import.meta.env.DEV': 'false',
    'import.meta.env.PROD': 'true',
    'import.meta.env.SSR': 'false',
  },

  // Ensure proper module resolution
  resolve: {
    alias: {
      'react': 'react',
      'react-dom': 'react-dom',
    },
  },

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
        // Ensure assets use relative paths
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        // Ensure proper module format
        format: 'es',
        // Ensure proper module loading
        exports: 'named',
        // Add proper globals for external dependencies
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
        },
      },
      // External dependencies that should not be bundled
      external: [],
      // Add plugins to handle problematic imports
      plugins: [],
    },
    // Ensure proper asset loading
    assetsInlineLimit: 0,
    // Ensure proper module resolution
    modulePreload: false,
    // Add polyfills for Node.js globals
    commonjsOptions: {
      include: [],
      transformMixedEsModules: true,
    },
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: [],
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
