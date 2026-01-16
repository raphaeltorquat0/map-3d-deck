import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: __dirname,
  base: '/map-3d-deck/',
  resolve: {
    alias: {
      '@raphaeltorquat0/map-3d-deck': resolve(__dirname, '../../src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    port: 5173,
    open: true,
  },
})
