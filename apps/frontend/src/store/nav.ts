import { ref } from 'vue'

function getInitialView() {
  const hash = window.location.hash.slice(1)
  return hash || 'dashboard'
}

export const currentView = ref(getInitialView())

export function setView(view: string) {
  currentView.value = view
  window.location.hash = view
}

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.slice(1)
  if (hash) currentView.value = hash
})
