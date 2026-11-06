/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// The game is read-only safe: the built page may not open any network connection.
const CSP = "default-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"

// Build only: the dev server needs a websocket for hot reload.
const csp = (): Plugin => ({
  name: 'csp',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
})

export default defineConfig({
  base: '/awesomeProject1/',
  plugins: [react(), csp()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})
