import type { VueAppInstance } from '@vue-devtools-next/schema'

export interface InspectorCustomState {
  _custom?: {
    type?: string
    displayText?: string
    tooltipText?: string
    value?: string
    stateTypeName?: string
    fields?: {
      abstract?: boolean
    }
  }
}

export interface InspectorState {
  key: string
  value: string | number | Record<string, unknown> | InspectorCustomState | Array<unknown>
  type: string
  stateTypeName?: string
  meta?: Record<string, boolean | string>
  raw?: string
  editable?: boolean
  children?: {
    key: string
    value: string | number
    type: string
  }[]
}

export interface InspectorStateApiPayload {
  app: VueAppInstance
  inspectorId: string
  nodeId: string
}

export interface AddInspectorApiPayload {
  id: string
  label: string
  icon?: string
  treeFilterPlaceholder?: string
  actions?: {
    icon: string
    tooltip: string
    action: (payload: unknown) => void
  }[]
}
