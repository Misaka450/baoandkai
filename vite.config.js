import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'https://baoandkai.pages.dev', // 使用生产环境的API
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  }
})