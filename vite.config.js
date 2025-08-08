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
        target: 'https://baoandkai.pages.dev',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  },
  base: './' // 确保相对路径正确
})