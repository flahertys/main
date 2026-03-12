import { defineConfig } from "vite";
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      fastRefresh: true,
      jsxImportSource: 'react'
    })
  ],
  build: {
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2
      },
      mangle: true,
      output: {
        comments: false
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'api': ['./src/lib/api-client.ts']
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 800,
    sourcemap: false,
    cssCodeSplit: true,
    reportCompressedSize: true,
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  },
  server: {
    host: true,
    port: 4173,
    middlewareMode: false,
    cors: true,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY'
    }
  },
  preview: {
    host: true,
    port: 4173
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['node_modules']
  }
});

