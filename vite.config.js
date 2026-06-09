import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/hls': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/stream': {
        target: 'https://aac.saavncdn.com',
        changeOrigin: true,
        router: (req) => {
          // Extract hostname from path: /stream/HOSTNAME/path
          const match = req.url.match(/^\/stream\/([^\/]+)/)
          if (match) {
            return `https://${match[1]}`
          }
          return 'https://aac.saavncdn.com'
        },
        rewrite: (path) => path.replace(/^\/stream\/[^\/]+/, '')
      }
    }
  }
})
