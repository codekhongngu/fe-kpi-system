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
    },
  },
  optimizeDeps: {
    include: ['xlsx', 'xlsx-js-style'],
  },
  build: {
    rollupOptions: {
      external: [
        'fs',
        'stream',
        'crypto',
        'os',
        'zlib',
        'buffer',
        'path',
        'util',
        'child_process',
        'events',
      ],
    },
  },
})
