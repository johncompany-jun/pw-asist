import { ref } from 'vue'
import { API, useApi } from './useApi'

export function useNotify(rotationId: () => number | undefined, selectedDate: () => string, userName: () => string) {
  const { authHeaders: auth } = useApi()

  const showModal = ref(false)
  const message = ref('')
  const admins = ref<{ id: number; name: string }[]>([])
  const selectedAdminIds = ref<number[]>([])
  const sending = ref(false)
  const result = ref<string | null>(null)

  async function open() {
    const [, month, day] = selectedDate().split('-').map(Number)
    message.value = `親愛なる兄弟姉妹へ\n\n${userName()}でございます。\n${month}月${day}日のローテーションについてご連絡します。\nどうぞよろしくお願いします。
    \n\n当日のローテーションの確認はこちら:\nhttps://pw-assistant.com/#rotation`
    selectedAdminIds.value = []
    try {
      const res = await fetch(`${API}/api/users/admins`, { headers: auth() })
      if (res.ok) admins.value = await res.json()
    } catch {}
    showModal.value = true
  }

  function toggleAdmin(id: number) {
    const idx = selectedAdminIds.value.indexOf(id)
    if (idx >= 0) selectedAdminIds.value.splice(idx, 1)
    else selectedAdminIds.value.push(id)
  }

  function close() {
    showModal.value = false
    message.value = ''
    admins.value = []
    selectedAdminIds.value = []
    result.value = null
  }

  async function send() {
    const id = rotationId()
    if (!id) return
    sending.value = true
    result.value = null
    try {
      const res = await fetch(`${API}/api/rotations/${id}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth() },
        body: JSON.stringify({ message: message.value, ccAdminIds: selectedAdminIds.value }),
      })
      const data = await res.json()
      if (res.ok) {
        result.value = `${data.count}名に送信しました`
        setTimeout(close, 1500)
      } else {
        result.value = data.message || '送信に失敗しました'
      }
    } finally {
      sending.value = false
    }
  }

  return { showModal, message, admins, selectedAdminIds, sending, result, open, close, send, toggleAdmin }
}
