import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: __dirname,
  resolve: {
    alias: {
      '@raphaeltorquat0/map-3d-deck': resolve(__dirname, '../../src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
})
