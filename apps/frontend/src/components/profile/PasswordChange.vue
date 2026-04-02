<script setup lang="ts">
import { ref } from 'vue'
import { API, useApi } from '../../composables/useApi'

const { authHeaders } = useApi()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const message = ref('')
const error = ref('')
const loading = ref(false)

async function changePassword() {
  message.value = ''
  error.value = ''

  if (newPassword.value !== confirmPassword.value) {
    error.value = '新しいパスワードが一致しません'
    return
  }
  if (newPassword.value.length < 6) {
    error.value = 'パスワードは6文字以上にしてください'
    return
  }

  loading.value = true
  try {
    const res = await fetch(`${API}/api/me/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ currentPassword: currentPassword.value, newPassword: newPassword.value }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    message.value = 'パスワードを変更しました'
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
    <h4 class="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">パスワード変更</h4>
    <form @submit.prevent="changePassword" class="flex flex-col gap-4">
      <div>
        <label class="block text-sm text-zinc-400 mb-1.5">現在のパスワード</label>
        <input
          v-model="currentPassword"
          type="password"
          required
          class="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
        />
      </div>
      <div>
        <label class="block text-sm text-zinc-400 mb-1.5">新しいパスワード</label>
        <input
          v-model="newPassword"
          type="password"
          required
          class="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
        />
      </div>
      <div>
        <label class="block text-sm text-zinc-400 mb-1.5">新しいパスワード（確認）</label>
        <input
          v-model="confirmPassword"
          type="password"
          required
          class="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
        />
      </div>
      <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>
      <p v-if="message" class="text-emerald-400 text-sm">{{ message }}</p>
      <button
        type="submit"
        :disabled="loading"
        class="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
      >
        {{ loading ? '変更中...' : 'パスワードを変更' }}
      </button>
    </form>
  </div>
</template>
