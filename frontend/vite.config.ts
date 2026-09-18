import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Isti alias kao u tsconfig.app.json; oba moraju postojati jer TypeScript i
    // bundler razrješavaju putanje neovisno jedan o drugome.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // Backend se u razvoju posreduje kroz isti origin. Time HttpOnly cookie s
    // tokenom radi bez CORS-a i bez SameSite iznimki — isto kao u produkciji,
    // gdje nginx posreduje /api na backend. Dev i produkcija se tako ponašaju
    // jednako, pa se problemi s kolačićima ne pojave tek nakon deploya.
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:8080',
        changeOrigin: false,
      },
    },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Portali se učitavaju lijeno; ovo drži vendor kod izvan prvog
          // učitavanja javne stranice.
          react: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
          forms: ['react-hook-form', 'zod', '@hookform/resolvers/zod'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
});
