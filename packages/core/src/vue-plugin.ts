import type { App, InjectionKey, Plugin, Ref } from 'vue'
import { inject, ref } from 'vue'
import type { AppRecord, CustomCommand, CustomTab } from '@vue/devtools-kit'
import type { BridgeInstanceType } from './bridge'

import { onDevToolsStateUpdated } from './bridge-events/devtools-listeners'
import { getDevToolsState } from './bridge-events/devtools-actions'

export interface DevToolsPluginOptions {
  bridge: BridgeInstanceType
  viewMode: 'overlay' | 'panel'
}

export type DevtoolsBridgeAppRecord = Pick<AppRecord, 'name' | 'id' | 'version' | 'routerId' | 'moduleDetectives'>

function initDevToolsState() {
  const connected = ref(false)
  const clientConnected = ref(false)
  const componentCount = ref(0)
  const vueVersion = ref('')
  const tabs = ref<CustomTab[]>([])
  const commands = ref<CustomCommand[]>([])
  const vitePluginDetected = ref(false)
  const appRecords = ref<Array<DevtoolsBridgeAppRecord>>([])
  const activeAppRecordId = ref('')

  function init() {
    getDevToolsState().then((_data) => {
      const data = _data!
      connected.value = data.connected
      clientConnected.value = data.clientConnected
      vueVersion.value = data.vueVersion || ''
      tabs.value = data.tabs
      commands.value = data.commands
      vitePluginDetected.value = data.vitePluginDetected
      appRecords.value = data.appRecords
      activeAppRecordId.value = data.activeAppRecordId!
    })

    onDevToolsStateUpdated((data) => {
      connected.value = data.connected
      clientConnected.value = data.clientConnected
      vueVersion.value = data.vueVersion || ''
      tabs.value = data.tabs
      commands.value = data.commands
      vitePluginDetected.value = data.vitePluginDetected
      appRecords.value = data.appRecords
      activeAppRecordId.value = data.activeAppRecordId!
    })
  }

  return {
    init,
    restore: init,
    vueVersion,
    connected,
    clientConnected,
    componentCount,
    tabs,
    commands,
    vitePluginDetected,
    appRecords,
    activeAppRecordId,
  }
}

function initDevToolsBridge(_bridge: DevToolsPluginOptions['bridge']) {
  const bridge = ref<DevToolsPluginOptions['bridge']>(_bridge)

  function restore(_bridge: DevToolsPluginOptions['bridge']) {
    bridge.value = _bridge
  }
  return {
    bridge,
    restore,
  }
}

const VueDevToolsBridgeSymbol: InjectionKey<Ref<BridgeInstanceType>> = Symbol('VueDevToolsBridgeSymbol')
const VueDevToolsStateSymbol: InjectionKey<{
  connected: Ref<boolean>
  clientConnected: Ref<boolean>
  componentCount: Ref<number>
  vueVersion: Ref<string>
  tabs: Ref<CustomTab[]>
  commands: Ref<CustomCommand[]>
  vitePluginDetected: Ref<boolean>
  appRecords: Ref<Array<DevtoolsBridgeAppRecord>>
  activeAppRecordId: Ref<string>
}> = Symbol('VueDevToolsStateSymbol')

export function createDevToolsVuePlugin(pluginOptions: DevToolsPluginOptions): Plugin {
  return {
    install(app: App, options) {
      const { bridge: _bridge, viewMode: _viewMode } = pluginOptions
      const viewMode = ref(_viewMode)
      const state = initDevToolsState()
      const bridgeContext = initDevToolsBridge(_bridge)
      state.init()
      app.provide(VueDevToolsBridgeSymbol, bridgeContext.bridge)
      app.provide(VueDevToolsStateSymbol, state)
      app.provide('viewMode', viewMode)
      bridgeContext.bridge.value.on('toggle-view-mode', (v) => {
        viewMode.value = v
      })
      app.config.globalProperties.__VUE_DEVTOOLS_UPDATE__ = (_bridge: DevToolsPluginOptions['bridge']) => {
        bridgeContext.restore(_bridge)
        state.restore()
      }
    },
  }
}

export function useDevToolsBridge() {
  return inject(VueDevToolsBridgeSymbol)!
}

export function useDevToolsState() {
  return inject(VueDevToolsStateSymbol)!
}
