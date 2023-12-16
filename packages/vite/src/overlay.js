import vueDevToolsOptions from 'virtual:vue-devtools-options'
import { Bridge, prepareInjection, setDevToolsClientUrl } from '@vue-devtools-next/core'
import { BROADCAST_CHANNEL_NAME } from '@vue-devtools-next/shared'
import { addCustomTab, devtools } from '@vue-devtools-next/kit'

const overlayDir = `${vueDevToolsOptions.base || '/'}@id/virtual:vue-devtools-path:overlay`
const body = document.getElementsByTagName('body')[0]
const head = document.getElementsByTagName('head')[0]

window.__VUE_DEVTOOLS_VITE_PLUGIN_DETECTED__ = true
const devtoolsClientUrl = `${vueDevToolsOptions.clientHost || ''}${vueDevToolsOptions.base || '/'}__devtools__/`
setDevToolsClientUrl(devtoolsClientUrl)

devtools.init()

// create vite inspect tab
addCustomTab({
  title: 'Vite Inspect',
  name: 'vite-inspect',
  icon: 'i-carbon-ibm-watson-discovery',
  view: {
    type: 'iframe',
    src: `${window.location.origin}${vueDevToolsOptions.base || '/'}__inspect`,
  },
  category: 'advanced',
})

// create link stylesheet
const link = document.createElement('link')
link.rel = 'stylesheet'
link.href = `${overlayDir}/devtools-overlay.css`

// create script
const script = document.createElement('script')
script.src = `${overlayDir}/devtools-overlay.js`

// append to head
head.appendChild(link)

// append to body
body.appendChild(script)

// Used in the browser extension
window.__VUE_DEVTOOLS_VITE_PLUGIN_CLIENT_URL__ = `${window.location.origin}${devtoolsClientUrl}`

// @TODO: we might should move this to a separate file?
const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME)

const bridge = new Bridge({
  tracker(fn) {
    channel.onmessage = (event) => {
      if (event.data.source === '__VUE_DEVTOOLS_CLIENT__')
        fn(event.data.data)
    }
  },
  trigger(data) {
    channel.postMessage({
      source: '__VUE_DEVTOOLS_USER_APP__',
      data,
    })
  },
})

prepareInjection(bridge)

bridge.on('ready', () => {
  bridge.emit('__VUE_DEVTOOLS_CREATE_CLIENT__')
  // force sync to make sure that connect the devtools client
  setTimeout(() => {
    bridge.emit('syn')
  }, 200)
})
