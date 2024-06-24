# Plugins API

Plugins API for easier DevTools integrations.

:::tip

Since v7.3.0, we are fully compatible with the v6 plugin API. You can check out the [API documentation](https://devtools.vuejs.org/plugin/api-reference.html) here.
:::

## Installation

::: code-group

```sh [npm]
$ npm add -D @vue/devtools-api
```

```sh [pnpm]
$ pnpm add -D @vue/devtools-api
```

```sh [yarn]
$ yarn add -D @vue/devtools-api
```

```sh [bun]
$ bun add -D @vue/devtools-api
```

:::

## `addCustomTab`

```ts
import { addCustomTab } from '@vue/devtools-api'

addCustomTab({
  // unique identifier
  name: 'vue-use',
  // title to display in the tab
  title: 'VueUse',
  // any icon from Iconify, or a URL to an image
  icon: 'i-logos-vueuse',
  // iframe view
  view: {
    type: 'iframe',
    src: 'https://vueuse.org/',
  },
  category: 'advanced',
})
```

## `addCustomCommand`

```ts
import { addCustomCommand } from '@vue/devtools-api'

// Add a custom command with url
addCustomCommand({
  // unique identifier
  id: 'vueuse',
  // title to display in the command
  title: 'VueUse',
  // any icon from Iconify, or a URL to an image
  icon: 'i-logos-vueuse',
  action: {
    type: 'url',
    src: 'https://vueuse.org/'
  }
})

// Add a custom command with submenu
addCustomCommand({
  // unique identifier
  id: 'vueuse',
  // title to display in the command
  title: 'VueUse',
  // any icon from Iconify, or a URL to an image
  icon: 'i-logos-vueuse',
  // submenu, which is shown when the menu is clicked
  children: [
    {
      id: 'vueuse:github',
      title: 'Github',
      icon: 'i-carbon-logo-github',
      action: {
        type: 'url',
        src: 'https://github.com/vueuse/vueuse'
      }
    },
    {
      id: 'vueuse:website',
      title: 'Website',
      icon: 'i-logos-vueuse',
      action: {
        type: 'url',
        src: 'https://vueuse.org/'
      }
    },
  ],
})
```

## `removeCustomCommand`

```ts
import { removeCustomCommand } from '@vue/devtools-api'

// Remove a custom command by id
removeCustomCommand('vueuse')
```

## `onDevToolsClientConnected`

```ts
import { onDevToolsClientConnected } from '@vue/devtools-api'

onDevToolsClientConnected(() => {
  console.log('devtools client connected')
})
```
