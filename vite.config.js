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
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // 核心框架
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // 数据请求
          query: ['@tanstack/react-query'],
          // 动画库单独分包，按需加载
          animation: ['framer-motion'],
          // 图标库
          ui: ['lucide-react'],
          // 日期工具
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
        target: 'http://localhost:8788',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  },
  base: '/',
  resolve: {
    alias: {
      '@': '/src', // 路径别名
    },
  },
})