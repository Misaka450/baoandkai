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
  // 构建提速：使用 Vite 内置的 esbuild 压缩（比 terser 快 5-10 倍），
  // 并在生产包中移除 console / debugger
  esbuild: {
    drop: ['console', 'debugger'],
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // 生产环境关闭sourcemap减小体积
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          // 核心框架
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // 数据请求
          query: ['@tanstack/react-query'],
          // 动画库单独分包，按需加载
          animation: ['framer-motion'],
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
        target: 'http://localhost:3001',
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
