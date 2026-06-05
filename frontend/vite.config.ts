import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    host: true,
    allowedHosts: ['.pinggy-free.link', '.loca.lt', 'wntyk-118-69-36-3.run.pinggy-free.link'],

    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true,
      },

      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
        changeOrigin: true,
      },
    },

    // 🔥 TẮT HMR để tránh lỗi ngrok/websocket
    hmr: false
  }
})