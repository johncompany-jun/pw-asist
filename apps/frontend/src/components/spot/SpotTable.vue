<script setup lang="ts">
import { API, useApi } from '../../composables/useApi'

const props = defineProps<{ spots: any[]; loading: boolean; error: string }>()
const emit = defineEmits<{ deleted: [] }>()

const { authHeaders } = useApi()

async function deleteSpot(id: number) {
  if (!confirm('本当に削除しますか？')) return
  const res = await fetch(`${API}/api/spots/${id}`, { method: 'DELETE', headers: authHeaders() })
  if (!res.ok) { alert('スポットの削除に失敗しました'); return }
  emit('deleted')
}
</script>

<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
    <div v-if="loading" class="p-8 text-center text-zinc-500 text-sm">読み込み中...</div>
    <div v-else-if="error" class="p-8 text-center text-red-400 text-sm">{{ error }}</div>
    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-zinc-800">
            <th class="text-left px-4 py-3 text-zinc-400 font-medium sticky left-0 bg-zinc-900 z-10 min-w-30">スポット名</th>
            <th class="text-left px-4 py-3 text-zinc-400 font-medium min-w-45">住所</th>
            <th class="text-left px-4 py-3 text-zinc-400 font-medium min-w-60">説明</th>
            <th class="px-4 py-3 min-w-20"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="spot in spots" :key="spot.id" class="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50 transition-colors">
            <td class="px-4 py-4 text-white font-medium sticky left-0 bg-zinc-900 hover:bg-zinc-800/50 z-10">{{ spot.name }}</td>
            <td class="px-4 py-4 text-zinc-400">{{ spot.address || '-' }}</td>
            <td class="px-4 py-4 text-zinc-400">{{ spot.description || '-' }}</td>
            <td class="px-4 py-4 text-right">
              <button
                @click="deleteSpot(spot.id)"
                class="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-colors"
              >
                削除
              </button>
            </td>
          </tr>
          <tr v-if="spots.length === 0">
            <td colspan="4" class="px-4 py-8 text-center text-zinc-500">スポットがありません</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
