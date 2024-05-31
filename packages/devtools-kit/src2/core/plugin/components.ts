import { debounce } from 'perfect-debounce'
import type { App, PluginDescriptor, PluginSetupFunction } from '../../types'
import { hook } from '../../hook'
import { getAppRecord, getComponentId, getComponentInstance } from '../../core/component/utils'
import { DevToolsV6PluginAPIHookKeys, activeAppRecord, devtoolsContext, devtoolsState } from '../../ctx'
import { ComponentWalker } from '../../core/component/tree/walker'
import { getInstanceState } from '../../core/component/state'
import { editState } from '../../core/component/state/editor'

const INSPECTOR_ID = 'components'

export function createComponentsDevToolsPlugin(app: App): [PluginDescriptor, PluginSetupFunction] {
  const descriptor: PluginDescriptor = {
    id: INSPECTOR_ID,
    label: 'Components',
    app,
  }

  const setupFn: PluginSetupFunction = (api) => {
    api.addInspector({
      id: INSPECTOR_ID,
      label: 'Components',
      treeFilterPlaceholder: 'Search components',
    })

    api.on.getInspectorTree(async (payload) => {
      if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
        // @ts-expect-error skip type @TODO
        const instance = getComponentInstance(activeAppRecord.value!, payload.instanceId)
        if (instance) {
          const walker = new ComponentWalker({
            filterText: payload.filter,
            // @TODO: should make this configurable?
            maxDepth: 100,
            recursively: false,
          })
          // @ts-expect-error skip type @TODO
          payload.rootNodes = await walker.getComponentTree(instance)
        }
      }
    })

    api.on.getInspectorState(async (payload) => {
      if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
        const result = getInstanceState({
          instanceId: payload.nodeId,
        })
        const componentInstance = result.instance
        const app = result.instance?.appContext.app
        const _payload = {
          componentInstance,
          app,
          instanceData: result,
        }
        // @ts-expect-error hookable
        devtoolsContext.hooks.callHookWith((callbacks) => {
          callbacks.forEach(cb => cb(_payload))
        }, DevToolsV6PluginAPIHookKeys.INSPECT_COMPONENT)
        // @ts-expect-error skip type @TODO
        payload.state = result
      }
    })

    api.on.editInspectorState(async (payload) => {
      if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
        // @ts-expect-error skip type @TODO
        editState(payload)
        await api.sendInspectorState('components')
      }
    })

    // @TODO: on getComponentBoundingRect

    const debounceSendInspectorTree = debounce(() => {
      api.sendInspectorTree(INSPECTOR_ID)
    }, 120)

    const debounceSendInspectorState = debounce(() => {
      api.sendInspectorState(INSPECTOR_ID)
    }, 120)

    const componentAddedCleanup = hook.on.componentAdded(async (app, uid, parentUid, component) => {
      if (devtoolsState.highPerfModeEnabled)
        return

      if (app?._instance?.type?.devtools?.hide)
        return

      if (!app || (typeof uid !== 'number' && !uid) || !component)
        return

      const id = await getComponentId({
        app,
        uid,
        instance: component,
      }) as string
      const appRecord = await getAppRecord(app)

      if (component) {
        if (component.__VUE_DEVTOOLS_NEXT_UID__ == null)
          component.__VUE_DEVTOOLS_NEXT_UID__ = id

        if (!appRecord?.instanceMap.has(id)) {
          appRecord?.instanceMap.set(id, component)
          // force sync appRecord instanceMap
          if (activeAppRecord.value.id === appRecord?.id)
            activeAppRecord.value.instanceMap = appRecord!.instanceMap
        }
      }

      if (!appRecord)
        return

      debounceSendInspectorTree()
    })

    const componentUpdatedCleanup = hook.on.componentUpdated(async (app, uid, parentUid, component) => {
      if (devtoolsState.highPerfModeEnabled)
        return

      if (app?._instance?.type?.devtools?.hide)
        return

      if (!app || (typeof uid !== 'number' && !uid) || !component)
        return

      const id = await getComponentId({
        app,
        uid,
        instance: component,
      }) as string
      const appRecord = await getAppRecord(app)

      if (component) {
        if (component.__VUE_DEVTOOLS_NEXT_UID__ == null)
          component.__VUE_DEVTOOLS_NEXT_UID__ = id

        if (!appRecord?.instanceMap.has(id)) {
          // force sync appRecord instanceMap
          appRecord?.instanceMap.set(id, component)
          if (activeAppRecord.value.id === appRecord?.id)
            activeAppRecord.value.instanceMap = appRecord!.instanceMap
        }
      }

      if (!appRecord)
        return

      debounceSendInspectorTree()
      debounceSendInspectorState()
    })
    const componentRemovedCleanup = hook.on.componentRemoved(async (app, uid, parentUid, component) => {
      if (devtoolsState.highPerfModeEnabled)
        return

      if (app?._instance?.type?.devtools?.hide)
        return

      if (!app || (typeof uid !== 'number' && !uid) || !component)
        return

      const appRecord = await getAppRecord(app)

      if (!appRecord)
        return

      const id = await getComponentId({
        app,
        uid,
        instance: component,
      }) as string

      appRecord?.instanceMap.delete(id)
      // force sync appRecord instanceMap
      if (activeAppRecord.value.id === appRecord?.id)
        activeAppRecord.value.instanceMap = appRecord!.instanceMap

      debounceSendInspectorTree()
    })
  }

  return [descriptor, setupFn]
}
