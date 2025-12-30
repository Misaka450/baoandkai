import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: false, // 生产环境关闭sourcemap减小体积
    minify: 'terser', // 使用Terser压缩
    terserOptions: {
      compress: {
        drop_console: true, // 移除console.log
        drop_debugger: true, // 移除debugger
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // 代码分割
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
          sentry: ['@sentry/react', '@sentry/browser'],
          ui: ['lucide-react'],
          utils: ['date-fns'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // 块大小警告限制（KB）
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  },
  base: './',
  resolve: {
    alias: {
      '@': '/src', // 路径别名
    },
  },
})