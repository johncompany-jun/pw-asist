import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { useAuth } from './store/auth'
import { API } from './composables/useApi'

const { state, logout } = useAuth()
const originalFetch = window.fetch.bind(window)
window.fetch = Object.assign(
  async (input: URL | RequestInfo, init?: RequestInit) => {
    const res = await originalFetch(input, init)
    if (res.status === 401 && state.token) {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof Request
            ? input.url
            : input.toString()
      if (url.startsWith(API)) logout()
    }
    return res
  },
  { preconnect: window.fetch.preconnect.bind(window) },
)

createApp(App).mount('#app')
