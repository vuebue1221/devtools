import '@unocss/reset/tailwind.css'
import { Bridge, BridgeEvents, HandShakeServer, createDevToolsVuePlugin, registerBridgeRpc } from '@vue-devtools-next/core'
import FloatingVue from 'floating-vue'
import 'floating-vue/dist/style.css'
import { createApp } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from './App.vue'
import Components from '~/pages/components.vue'
import Overview from '~/pages/overview.vue'
import PiniaPage from '~/pages/pinia.vue'
import RouterPage from '~/pages/router.vue'
import Timeline from '~/pages/timeline.vue'

import 'uno.css'
import '~/assets/styles/main.css'

const routes = [
  { path: '/overview', component: Overview },
  { path: '/components', component: Components },
  { path: '/pinia', component: PiniaPage },
  { path: '/router', component: RouterPage },
  { path: '/router', component: RouterPage },
  { path: '/timeline', component: Timeline },
]

async function reload(app, shell) {
  Bridge.value.removeAllListeners()
  shell.connect((bridge) => {
    Bridge.value = bridge
    registerBridgeRpc('devtools')
    new HandShakeServer(Bridge.value).onnConnect().then(() => {
      app.config.globalProperties.__VUE_DEVTOOLS_UPDATE__(Bridge.value)
      Bridge.value.emit(BridgeEvents.CLIENT_READY)
    })
  })
}

async function connectApp(app, shell) {
  return new Promise<void>((resolve) => {
    shell.connect((bridge) => {
      // @TODO: find a better way to handle it
      Bridge.value = bridge
      resolve()
    })
    shell.reload(() => {
      reload(app, shell)
    })
  })
}

export async function initDevTools(shell) {
  const app = createApp(App)
  await connectApp(app, shell)
  registerBridgeRpc('devtools')
  new HandShakeServer(Bridge.value).onnConnect().then(() => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    })

    app.use(router)
    app.use(FloatingVue)
    app.use(createDevToolsVuePlugin({
      bridge: Bridge.value,
    }))
    app.mount('#app')
    Bridge.value.emit(BridgeEvents.CLIENT_READY)
  })
}

window.addEventListener('message', (event) => {
  if (event.data === '__VUE_DEVTOOLS_CREATE_CLIENT__') {
    initDevTools({
      connect: (callback) => {
        const bridge = new Bridge({
          tracker(fn) {
            window.addEventListener('message', (e) => {
              if (e.data.source === '__VUE_DEVTOOLS_USER_APP__')
                fn(e.data.data)
            })
          },
          trigger(data) {
            event?.source?.postMessage({
              source: '__VUE_DEVTOOLS_CLIENT__',
              data,
            }, {
              targetOrigin: '*',
            })
          },
        })
        callback(bridge)
      },
    })
    event.source?.postMessage('__VUE_DEVTOOLS_CLIENT_READY__')
  }
})
