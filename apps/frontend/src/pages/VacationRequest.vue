<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { API, useApi } from '../composables/useApi'

const { authHeaders: auth } = useApi()

const requests = ref<any[]>([])
const formDate = ref(new Date().toISOString().slice(0, 10))
const formComment = ref('')
const saving = ref(false)
const errorMsg = ref('')

async function fetchMyRequests() {
  const res = await fetch(`${API}/api/vacations/my`, { headers: auth() })
  requests.value = await res.json()
}

async function submit() {
  if (!formDate.value) return
  saving.value = true
  errorMsg.value = ''
  try {
    const res = await fetch(`${API}/api/vacations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({ date: formDate.value, comment: formComment.value.trim() || null }),
    })
    if (!res.ok) {
      errorMsg.value = '申請に失敗しました'
      return
    }
    formComment.value = ''
    await fetchMyRequests()
  } finally {
    saving.value = false
  }
}

async function cancel(id: number) {
  await fetch(`${API}/api/vacations/${id}`, { method: 'DELETE', headers: auth() })
  await fetchMyRequests()
}

onMounted(fetchMyRequests)
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- 申請フォーム -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h4 class="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">休み希望を申請</h4>
      <form @submit.prevent="submit" class="flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <label class="text-sm text-zinc-400 w-16 shrink-0">日付</label>
          <input
            v-model="formDate"
            type="date"
            required
            class="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-violet-500 transition-colors scheme-dark"
          />
        </div>
        <div class="flex items-center gap-3">
          <label class="text-sm text-zinc-400 w-16 shrink-0">コメント</label>
          <input
            v-model="formComment"
            placeholder="任意のコメント"
            class="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        <p v-if="errorMsg" class="text-red-400 text-sm">{{ errorMsg }}</p>
        <div class="flex justify-end">
          <button
            type="submit"
            :disabled="saving"
            class="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
          >{{ saving ? '送信中...' : '申請する' }}</button>
        </div>
      </form>
    </div>

    <!-- 申請履歴 -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h4 class="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">申請履歴</h4>
      <div v-if="requests.length === 0" class="text-zinc-500 text-sm py-4 text-center">
        申請はありません
      </div>
      <div v-else class="flex flex-col gap-2">
        <div
          v-for="req in requests"
          :key="req.id"
          class="flex items-center justify-between px-4 py-3 bg-zinc-800 rounded-lg"
        >
          <div class="flex flex-col gap-0.5">
            <span class="text-white text-sm font-medium">{{ req.date }}</span>
            <span v-if="req.comment" class="text-zinc-400 text-xs">{{ req.comment }}</span>
          </div>
          <button
            @click="cancel(req.id)"
            class="text-xs px-3 py-1.5 bg-zinc-700 hover:bg-red-700 border border-zinc-600 hover:border-red-600 text-zinc-300 hover:text-white rounded-lg transition-colors"
          >取消</button>
        </div>
      </div>
    </div>
  </div>
</template>
