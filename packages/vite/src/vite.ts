import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { normalizePath } from 'vite'
import type { PluginOption, ResolvedConfig, ViteDevServer } from 'vite'
import sirv from 'sirv'
import Inspect from 'vite-plugin-inspect'
import VueInspector from 'vite-plugin-vue-inspector'
import { initViteServerContext } from '@vue/devtools-core'
import { bold, cyan, dim, green, yellow } from 'kolorist'
import type { VitePluginInspectorOptions } from 'vite-plugin-vue-inspector'
import { DIR_CLIENT } from './dir'
import { getViteConfig, setupAssetsModule, setupGraphModule } from './modules'

export type * from './modules'

type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : Required<T[P]>;
}

function getVueDevtoolsPath() {
  const pluginPath = normalizePath(path.dirname(fileURLToPath(import.meta.url)))
  return pluginPath.replace(/\/dist$/, '/\/src')
}

const toggleComboKeysMap = {
  option: process.platform === 'darwin' ? 'Option(⌥)' : 'Alt(⌥)',
  meta: 'Command(⌘)',
  shift: 'Shift(⇧)',
}
function normalizeComboKeyPrint(toggleComboKey: string) {
  return toggleComboKey.split('-').map(key => toggleComboKeysMap[key] || key[0].toUpperCase() + key.slice(1)).join(dim('+'))
}

export interface VitePluginVueDevToolsOptions {
  /**
   * append an import to the module id ending with `appendTo` instead of adding a script into body
   * useful for projects that do not use html file as an entry
   *
   * WARNING: only set this if you know exactly what it does.
   * @default ''
   */
  appendTo?: string | RegExp

  /**
   * Customize openInEditor host (e.g. http://localhost:3000)
   * @default false
   */
  openInEditorHost?: string | false

  /**
   * DevTools client host (e.g. http://localhost:3000)
   * useful for projects that use a reverse proxy
   * @default false
   */
  clientHost?: string | false

  /**
   * Enable Vue Component Inspector
   *
   * @default true
   */
  componentInspector?: boolean | VitePluginInspectorOptions
}

const defaultOptions: DeepRequired<VitePluginVueDevToolsOptions> = {
  appendTo: '',
  openInEditorHost: false,
  clientHost: false,
  componentInspector: true,
}

function mergeOptions(options: VitePluginVueDevToolsOptions): DeepRequired<VitePluginVueDevToolsOptions> {
  return Object.assign({}, defaultOptions, options)
}

export default function VitePluginVueDevTools(options?: VitePluginVueDevToolsOptions): PluginOption {
  const vueDevtoolsPath = getVueDevtoolsPath()
  const inspect = Inspect({
    silent: true,
  })

  const pluginOptions = mergeOptions(options ?? {})

  let config: ResolvedConfig

  function configureServer(server: ViteDevServer) {
    const base = (server.config.base) || '/'
    server.middlewares.use(`${base}__devtools__`, sirv(DIR_CLIENT, {
      single: true,
      dev: true,
    }))

    // vite client <-> server messaging
    initViteServerContext(server)
    getViteConfig(config, pluginOptions)
    setupGraphModule({
      rpc: inspect.api.rpc,
      server,
    })
    setupAssetsModule({
      rpc: inspect.api.rpc,
      server,
      config,
    })

    const _printUrls = server.printUrls
    const colorUrl = (url: string) =>
      cyan(url.replace(/:(\d+)\//, (_, port) => `:${bold(port)}/`))

    server.printUrls = () => {
      const urls = server.resolvedUrls!
      const keys = normalizeComboKeyPrint('option-shift-d')
      _printUrls()
      for (const url of urls?.local)
        console.log(`  ${green('➜')}  ${bold('Vue DevTools')}: ${green(`Open ${colorUrl(`${url}__devtools__/`)} as a separate window`)}`)
      console.log(`  ${green('➜')}  ${bold('Vue DevTools')}: ${green(`Press ${yellow(keys)} in App to toggle the Vue DevTools`)}\n`)
    }
  }
  const plugin = <PluginOption>{
    name: 'vite-plugin-vue-devtools',
    enforce: 'pre',
    apply: 'serve',
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    configureServer(server) {
      configureServer(server)
    },
    async resolveId(importee: string) {
      if (importee.startsWith('virtual:vue-devtools-options')) {
        return importee
      }
      else if (importee.startsWith('virtual:vue-devtools-path:')) {
        const resolved = importee.replace('virtual:vue-devtools-path:', `${vueDevtoolsPath}/`)
        return resolved
      }
    },
    async load(id) {
      if (id === 'virtual:vue-devtools-options')
        return `export default ${JSON.stringify({ base: config.base, clientHost: pluginOptions.clientHost, componentInspector: pluginOptions.componentInspector })}`
    },
    transform(code, id) {
      const { root, base } = config

      const projectPath = `${root}${base}`

      if (!id.startsWith(projectPath))
        return

      const { appendTo } = pluginOptions

      const [filename] = id.split('?', 2)
      if (appendTo
        && (
          (typeof appendTo === 'string' && filename.endsWith(appendTo))
          || (appendTo instanceof RegExp && appendTo.test(filename))))
        code = `${code}\nimport 'virtual:vue-devtools-path:overlay.js'`

      return code
    },
    transformIndexHtml(html) {
      if (pluginOptions.appendTo)
        return

      return {
        html,
        tags: [
          {
            tag: 'script',
            injectTo: 'head-prepend',
            attrs: {
              type: 'module',
              src: `${config.base || '/'}@id/virtual:vue-devtools-path:overlay.js`,
            },
          },
          // inject inspector script manually to ensure it's loaded after vue-devtools
          pluginOptions.componentInspector && {
            tag: 'script',
            injectTo: 'head-prepend',
            attrs: {
              type: 'module',
              src: `${config.base || '/'}@id/virtual:vue-inspector-path:load.js`,
            },
          },
        ].filter(Boolean),
      }
    },
    async buildEnd() {
    },
  }

  return [
    inspect as PluginOption,
    pluginOptions.componentInspector && VueInspector({
      toggleComboKey: '',
      toggleButtonVisibility: 'never',
      ...typeof pluginOptions.componentInspector === 'boolean'
        ? {}
        : pluginOptions.componentInspector,
      openInEditorHost: pluginOptions.openInEditorHost,
      appendTo: pluginOptions.appendTo || 'manually',
    }) as PluginOption,
    plugin,
  ].filter(Boolean)
}
