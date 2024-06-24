import antfu from '@antfu/eslint-config'
import devtools from './eslint-plugins'

export default antfu({
  // force enable vue and typescript rules
  vue: true,
  typescript: true,
  unocss: true,

  formatters: {
    css: true,
    html: true,
    markdown: true,
  },

  // override default rules
  rules: {
    'vue/no-v-text-v-html-on-component': 'off',

    'no-console': 'off',
    'antfu/top-level-function': 'off',
    'unused-imports/no-unused-vars': 'off',

    'node/prefer-global/process': 'off',

    'ts/no-invalid-this': 'off',
    'ts/consistent-type-imports': 'off',
    'ts/ban-types': 'off',
  },
}, {
  files: ['packages/devtools-kit/**/*.ts'],
  plugins: {
    devtools,
  },
  rules: {
    'devtools/no-vue-runtime-import': ['error', {
      prefer: 'shared/stub-vue',
    }],
  },
})
