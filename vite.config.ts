import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: { __BUILD_ID__: JSON.stringify(`v3 · ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`) },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:8787' },
  },
})
