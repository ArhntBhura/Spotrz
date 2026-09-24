import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

// The backend has no CORS headers, so the dev server proxies REST calls
// (under /api) and the WebSocket (/ws) to it — the browser only ever
// talks to the Vite origin.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/ws': {
        target: BACKEND_URL,
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
