<script setup lang="ts">
import { ref } from 'vue'
import { API, useApi } from '../../composables/useApi'

const emit = defineEmits<{ created: [] }>()

const { authHeaders } = useApi()

const name = ref('')
const address = ref('')
const description = ref('')

async function createSpot() {
  const res = await fetch(`${API}/api/spots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name: name.value, address: address.value, description: description.value }),
  })
  if (!res.ok) { alert('スポットの登録に失敗しました'); return }
  name.value = ''
  address.value = ''
  description.value = ''
  emit('created')
}
</script>

<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
    <h4 class="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">新規スポット登録</h4>
    <form @submit.prevent="createSpot" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <input
        v-model="name"
        placeholder="スポット名"
        required
        class="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
      />
      <input
        v-model="address"
        placeholder="住所 / 場所"
        class="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
      />
      <input
        v-model="description"
        placeholder="説明"
        class="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
      />
      <div class="sm:col-span-3 flex justify-end">
        <button
          type="submit"
          class="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          登録
        </button>
      </div>
    </form>
  </div>
</template>
