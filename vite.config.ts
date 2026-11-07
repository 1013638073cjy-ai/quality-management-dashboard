import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,

    // 开发环境中，将 /api 请求转发到 Express
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    // 输出目录
    outDir: 'dist',

    // 构建时显示 gzip 体积信息
    reportCompressedSize: true,
  },
})
