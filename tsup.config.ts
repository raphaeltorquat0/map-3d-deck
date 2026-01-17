import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'layers/index': 'src/layers/index.ts',
    'controls/index': 'src/controls/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: ['maplibre-gl'],
  minify: false,
  // Inject environment variables at build time
  env: {
    POSTHOG_API_KEY: process.env.POSTHOG_API_KEY || '',
    POSTHOG_HOST: process.env.POSTHOG_HOST || 'https://app.posthog.com',
  },
})
