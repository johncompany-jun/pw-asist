<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '../store/auth'
import { setView } from '../store/nav'
import { API } from '../composables/useApi'

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const { login } = useAuth()

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const res = await fetch(`${API}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.message || 'Login failed')
    }

    const { user, token } = await res.json()
    login(user, token)
    setView('dashboard')
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 bg-cover bg-center bg-no-repeat" style="background-image: url('/login.jpg')">
    <div class="w-full max-w-sm bg-zinc-900/70 backdrop-blur-sm border border-zinc-800 rounded-xl shadow-2xl p-8">
      <h2 class="text-xl font-bold text-white mb-6">ログイン</h2>
      <form @submit.prevent="handleLogin" class="flex flex-col gap-4">
        <div>
          <label class="block text-sm text-zinc-400 mb-1.5">メールアドレス</label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="admin@example.com"
            class="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        <div>
          <label class="block text-sm text-zinc-400 mb-1.5">パスワード</label>
          <input
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            class="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>
        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors mt-2"
        >
          {{ loading ? 'ログイン中...' : 'ログイン' }}
        </button>
      </form>
    </div>
  </div>
</template>
