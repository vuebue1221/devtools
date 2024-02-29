import { defineConfig } from 'tsup'

export default defineConfig({
  entryPoints: [
    'src/index.ts',
  ],
  external: [
    'vue',
  ],
  // clean: true,
  format: ['esm', 'cjs'],
  dts: true,
  shims: true,
})
