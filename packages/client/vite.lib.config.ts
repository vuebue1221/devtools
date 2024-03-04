import { resolve } from 'node:path'
import { defineConfig, mergeConfig } from 'vite'
import fse from 'fs-extra'
import baseConfig from './vite.base.config'

export default defineConfig(mergeConfig(baseConfig, {

  define: {
    'process.env': process.env,
  },
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, './src/index.ts'),
      name: 'devtoolsPanel',
      fileName: () => 'devtools-panel.js',
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        assetFileNames: 'devtools-panel.[ext]',
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
  plugins: [
    {
      name: 'local-object-transform',
      transform: {
        order: 'post',
        async handler(code) {
          return `${code}\n/* Injected with object hook! */`
        },
      },
    },
    {
      name: 'vite-plugin-copy-devtools-client',
      apply: 'build',
      enforce: 'post',
      closeBundle() {
        // copy
        const clientFile = resolve(__dirname, './dist')
        ;['../browser-extension/client', '../electron/client'].forEach((dir) => {
          fse.copySync(clientFile, resolve(__dirname, dir))
        })
      },
    },
  ],
}))
