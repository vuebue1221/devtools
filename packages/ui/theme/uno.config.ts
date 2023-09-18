import type { UserConfig } from 'unocss'
import {
  presetIcons,
  presetUno,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'
import { theme } from './theme'

export const unoConfig = {
  presets: [
    presetUno(),
    presetIcons({
      scale: 1.2,
    }),
  ],
  transformers: [transformerVariantGroup(), transformerDirectives()],
  theme,
  shortcuts: {
    // utilities
    '$ui-fcc': 'flex justify-center items-center',
    '$ui-fbc': 'flex justify-between items-center',
    '$ui-inline-fcc': 'inline-flex justify-center items-center',
    '$ui-z-max': 'z-2147483647',

    // general
    '$ui-bg-base': 'bg-white dark:bg-black',
    '$ui-base': 'box-border font-inherit',
    '$ui-transition': 'transition-all duration-300 ease-in-out',
    '$ui-borderless': '!border-transparent !shadow-none',
    '$ui-base-br': 'rounded-3px',
    '$ui-border-base': 'border-gray/20',
  },
  rules: [
    ['$ui-font-inherit', { 'font-family': 'inherit' }],
    [
      // the animation of dark toggle button
      /^\$ui-dark-toggle-vtr$/,
      () => {
        return `
          ::view-transition-old(root),
          ::view-transition-new(root) {
            animation: none;
            mix-blend-mode: normal;
          }

          ::view-transition-old(root),
          .dark::view-transition-new(root) {
            z-index: 1;
          }

          ::view-transition-new(root),
          .dark::view-transition-old(root) {
            z-index: 9999;
          }
        `
      },
    ],
  ],
} as UserConfig
