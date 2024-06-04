import { ref } from 'vue'
import { DevToolsMessagingEvents, onRpcConnected, rpc } from '@vue/devtools-core'

export interface CustomInspectorType {
  id: string
  label: string
  logo: string
  packageName: string | undefined
  homepage: string | undefined
}

export function useCustomInspector() {
  const registeredInspector = ref<CustomInspectorType[]>([])
  const inspectors = ref<CustomInspectorType[]>([])
  onRpcConnected(() => {
    rpc.value.getCustomInspector().then((inspector) => {
      inspectors.value = inspector
      inspectors.value.forEach((inspector) => {
        register(inspector)
      })
    })
    rpc.functions.on(DevToolsMessagingEvents.INSPECTOR_UPDATED, (inspector: CustomInspectorType[]) => {
      inspectors.value = inspector
      if (inspector.length < registeredInspector.value.length) {
        registeredInspector.value = []
      }
      inspectors.value.forEach((inspector) => {
        register(inspector)
      })
    })
  })

  function register(inspector: CustomInspectorType) {
    if (registeredInspector.value.some(i => i.id === inspector.id)) {
      return
    }

    registeredInspector.value.push(inspector)
  }

  return {
    registeredInspector,
    register,
  }
}
