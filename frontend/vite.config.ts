import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

export default defineConfig({
  // ── REMOVED: include: '**/*.{jsx,tsx}' ────────────────────────────────────
  // @vitejs/plugin-react v5 uses absolute Vite module IDs internally.
  // That glob pattern failed to match them, so the React Refresh preamble was
  // never injected → "can't detect preamble" crash on every hot reload.
  // The plugin's own default filter already handles all .jsx/.tsx/.js/.ts files
  // correctly — no override needed.
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    port: 5173,
    headers: {
      'Content-Security-Policy': [
        "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:",
        "connect-src * ws: wss: http: https:",
        "script-src * 'unsafe-inline' 'unsafe-eval'",
        "style-src * 'unsafe-inline'",
        "img-src * data: blob:",
        "font-src * data:",
        "frame-src *",
        "media-src * blob:",
      ].join('; '),
    },
  },
})