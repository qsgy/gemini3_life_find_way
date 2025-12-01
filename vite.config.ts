
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 确保资源使用相对路径，避免部署后路径错误导致白屏
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})
