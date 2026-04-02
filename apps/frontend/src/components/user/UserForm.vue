<script setup lang="ts">
import { ref } from 'vue'
import { API, useApi } from '../../composables/useApi'
import { Gender } from '../../constants/gender'

const emit = defineEmits<{ created: [] }>()

const { authHeaders: auth } = useApi()

const DEFAULT_PASSWORD = 'SmpwFa10'

const newEmail = ref('')
const newName = ref('')
const newGender = ref('')
const newIsAdmin = ref(false)

async function createUser() {
  try {
    const res = await fetch(`${API}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({
        email: newEmail.value,
        name: newName.value,
        password: DEFAULT_PASSWORD,
        isAdmin: newIsAdmin.value,
        gender: newGender.value || null,
      }),
    })
    if (!res.ok) throw new Error('ユーザーの作成に失敗しました')
    newEmail.value = ''
    newName.value = ''
    newGender.value = ''
    newIsAdmin.value = false
    emit('created')
  } catch (e: any) {
    alert(e.message)
  }
}
</script>

<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
    <h4 class="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">新規ユーザー作成</h4>
    <form @submit.prevent="createUser" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <input
        v-model="newEmail"
        type="email"
        placeholder="メールアドレス"
        required
        class="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
      />
      <input
        v-model="newName"
        placeholder="名前"
        required
        class="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
      />
      <select
        v-model="newGender"
        required
        class="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-violet-500 transition-colors"
      >
        <option value="" disabled>性別を選択</option>
        <option :value="Gender.MALE">兄弟</option>
        <option :value="Gender.FEMALE">姉妹</option>
      </select>
      <div class="sm:col-span-3 flex items-center justify-between">
        <label class="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
          <input v-model="newIsAdmin" type="checkbox" class="accent-violet-500" />
          管理者権限を付与
        </label>
        <button
          type="submit"
          class="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          追加
        </button>
      </div>
    </form>
  </div>
</template>
