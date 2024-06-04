import type { Component, ComputedRef, InjectionKey, Ref } from 'vue'
import { computed, defineComponent, h, inject, provide, ref, toValue } from 'vue'
import type { MaybeRef } from '@vueuse/core'

export interface VirtualRoute { path: string, component: Component, icon?: string, name?: string }
const VirtualRouteKey: InjectionKey<Ref<{ path: string }>> = Symbol('VirtualRouteKey')
const VirtualRoutesKey: InjectionKey<ComputedRef<VirtualRoute[]>> = Symbol('VirtualRoutesKey')

export function registerVirtualRouter(routes: MaybeRef<VirtualRoute[]>) {
  const route = ref<{ path: string, icon?: string }>({
    path: '/',
  })

  const _routes = computed(() => toValue(routes))
  const routePath = computed(() => route.value.path)

  const VirtualRouterView = defineComponent({
    setup() {
      return () => {
        const route = _routes.value.find(route => route.path === routePath.value)
        if (route)
          return h(route.component)

        return null
      }
    },
  })

  function restoreRouter() {
    route.value.path = '/'
  }

  provide(VirtualRouteKey, route)
  provide(VirtualRoutesKey, _routes)
  return { VirtualRouterView, restoreRouter }
}

export function useVirtualRouter() {
  const route = inject(VirtualRouteKey)!

  return {
    push(path: string) {
      route.value.path = path
    },
  }
}

export function useVirtualRoute() {
  const routes = inject(VirtualRoutesKey)!
  const route = inject(VirtualRouteKey)!

  return {
    routes,
    currentRoute: route,
  }
}
