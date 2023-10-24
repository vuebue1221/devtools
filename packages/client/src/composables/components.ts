import { useDevToolsBridgeRpc } from '@vue-devtools-next/core'
import type { ComponentTreeNode, InspectorState } from 'vue-devtools-kit'
import { ref } from 'vue'

const bridgeRpc = useDevToolsBridgeRpc()

const activeComponentState = ref<Record<string, InspectorState[]>>({})

export function normalizeComponentState(data: { state?: InspectorState[] }) {
  if (!data || !data?.state)
    return {}
  const res = {}
  data.state.forEach((item) => {
    if (!res[item.type])
      res[item.type] = []
    res[item.type].push(item)
  })
  return res
}

export function normalizeComponentTreeCollapsed(treeNode: ComponentTreeNode[]) {
  return {
    [treeNode[0].id]: true,
    ...treeNode?.[0].children?.reduce((acc, cur) => {
      acc[cur.id] = true
      return acc
    }, {}),
  }
}

export function checkComponentInTree(treeNode: ComponentTreeNode[], id: string) {
  if (!treeNode.length)
    return false
  if (treeNode.find(item => item.id === id))
    return true
  return treeNode.some(item => checkComponentInTree(item.children || [], id))
}

export function getComponentState(id: string) {
  bridgeRpc.getInspectorState({ inspectorId: 'components', nodeId: id }).then(({ data }) => {
    activeComponentState.value = normalizeComponentState(data.state)
  })
}

export function useComponentState() {
  return {
    activeComponentState,
  }
}
