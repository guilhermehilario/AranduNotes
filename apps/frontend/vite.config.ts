/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // ── SPA Mode ──
  // Garante que todas as rotas caiam no index.html, essencial para React Router
  appType: 'spa',
  server: {
    hmr: {
      overlay: true,
    },
  },
  // ── Preview server também com fallback SPA ──
  preview: {
    host: true,
    port: 4173,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
