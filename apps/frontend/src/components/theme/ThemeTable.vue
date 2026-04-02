<script setup lang="ts">
import { API, useApi } from '../../composables/useApi'
import { linkify } from '../../utils/linkify'

const props = defineProps<{ themes: any[]; loading: boolean }>()
const emit = defineEmits<{ edit: [theme: any]; deleted: [] }>()

const { authHeaders: auth } = useApi()

function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

function weekLabel(weekStart: string): string {
  const start = new Date(weekStart)
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  return `${start.toLocaleDateString('ja-JP')} 〜 ${end.toLocaleDateString('ja-JP')}`
}

const currentWeekStart = getWeekStart()

async function deleteTheme(id: number) {
  if (!confirm('このテーマを削除しますか？')) return
  await fetch(`${API}/api/themes/${id}`, { method: 'DELETE', headers: auth() })
  emit('deleted')
}
</script>

<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
    <div v-if="loading" class="p-8 text-center text-zinc-500 text-sm">読み込み中...</div>
    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-zinc-800">
            <th class="text-left px-4 py-3 text-zinc-400 font-medium sticky left-0 bg-zinc-900 z-10 min-w-40">週</th>
            <th class="text-left px-4 py-3 text-zinc-400 font-medium min-w-30">タイトル</th>
            <th class="text-left px-4 py-3 text-zinc-400 font-medium min-w-60">説明</th>
            <th class="px-4 py-3 min-w-24"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="theme in themes"
            :key="theme.id"
            class="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50 transition-colors"
          >
            <td class="px-4 py-4 text-zinc-400 whitespace-nowrap sticky left-0 bg-zinc-900 hover:bg-zinc-800/50 z-10">
              {{ weekLabel(theme.weekStart) }}
              <span v-if="theme.weekStart === currentWeekStart" class="ml-1 text-[10px] px-1.5 py-0.5 bg-violet-500/20 text-violet-400 border border-violet-500/30 rounded">今週</span>
            </td>
            <td class="px-4 py-4 text-white font-medium">{{ theme.title }}</td>
            <td class="px-4 py-4 text-zinc-400 max-w-xs wrap-break-word whitespace-pre-wrap" v-html="theme.body ? linkify(theme.body) : '—'" />
            <td class="px-4 py-4 text-right">
              <div class="flex gap-2 justify-end">
                <button
                  @click="emit('edit', theme)"
                  class="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 border border-zinc-600 rounded-lg transition-colors text-xs"
                >編集</button>
                <button
                  @click="deleteTheme(theme.id)"
                  class="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-colors text-xs"
                >削除</button>
              </div>
            </td>
          </tr>
          <tr v-if="themes.length === 0">
            <td colspan="4" class="px-4 py-8 text-center text-zinc-500">テーマがありません</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
