/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    // The project path contains a space; the default "forks" pool fails to spawn
    // workers under that path on Windows, so use the threads pool instead.
    pool: 'threads',
    // Reset the DOM/localStorage-backed globals between test files.
    restoreMocks: true,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // Dev-only: khi preview chạy cổng khác 5173 (vd 5174), backend chỉ allowlist
        // 5173 nên trả 403 CORS. Giả Origin về 5173 cho qua. Không ảnh hưởng prod/build.
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            if (proxyReq.getHeader('origin')) proxyReq.setHeader('origin', 'http://localhost:5173');
          });
        },
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            return 'vendor';
          }
        },
      },
    },
  },
})
