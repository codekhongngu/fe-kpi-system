import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      fs: path.resolve(__dirname, './src/mocks/node-mock.ts'),
      stream: path.resolve(__dirname, './src/mocks/node-mock.ts'),
      crypto: path.resolve(__dirname, './src/mocks/node-mock.ts'),
      os: path.resolve(__dirname, './src/mocks/node-mock.ts'),
      zlib: path.resolve(__dirname, './src/mocks/node-mock.ts'),
      buffer: path.resolve(__dirname, './src/mocks/node-mock.ts'),
      path: path.resolve(__dirname, './src/mocks/node-mock.ts'),
      util: path.resolve(__dirname, './src/mocks/node-mock.ts'),
      child_process: path.resolve(__dirname, './src/mocks/node-mock.ts'),
      events: path.resolve(__dirname, './src/mocks/node-mock.ts'),
    },
  },
  optimizeDeps: {
    include: ['xlsx', 'xlsx-js-style'],
  },
})
