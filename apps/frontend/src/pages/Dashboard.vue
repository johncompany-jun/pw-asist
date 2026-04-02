<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '../store/auth'
import { API, useApi } from '../composables/useApi'
import { linkify } from '../utils/linkify'

const { state } = useAuth()
const { authHeaders } = useApi()

const currentTheme = ref<{ title: string; body?: string } | null>(null)
const weekSchedules = ref<{ date: string; spotName: string; isLead: boolean }[]>([])

function getWeekRange() {
  const today = new Date()
  const day = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { from: fmt(monday), to: fmt(sunday) }
}

const WEEKDAY = ['日', '月', '火', '水', '木', '金', '土']
function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${dateStr.slice(5).replace('-', '/')}（${WEEKDAY[d.getDay()]}）`
}

async function fetchCurrentTheme() {
  const res = await fetch(`${API}/api/themes/current`, { headers: authHeaders() })
  currentTheme.value = res.ok ? await res.json() : null
}

async function fetchWeekSchedules() {
  const res = await fetch(`${API}/api/schedules`, { headers: authHeaders() })
  if (!res.ok) return
  const all = await res.json()
  const { from, to } = getWeekRange()
  const userId = state.user?.id
  weekSchedules.value = all
    .filter((s: any) => s.userId === userId && s.spotId !== null && s.date >= from && s.date <= to)
    .sort((a: any, b: any) => a.date.localeCompare(b.date))
}

onMounted(() => {
  fetchCurrentTheme()
  fetchWeekSchedules()
})
</script>

<template>
  <div class="bg-zinc-900 rounded-xl border border-zinc-800 p-6 flex flex-col gap-5">
    <div>
      <h2 class="text-lg font-semibold text-white mb-2">おかえりなさい、{{ state.user?.name }}さん！</h2>
      <div v-if="state.user?.isAdmin" class="inline-block mt-4 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm">
        管理者権限が有効です
      </div>
    </div>

    <div class="border-t border-zinc-800 pt-5">
      <h3 class="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">今週の担当スポット</h3>
      <div v-if="weekSchedules.length" class="flex flex-col gap-2">
        <div v-for="s in weekSchedules" :key="s.date" class="flex items-center justify-between px-3 py-2 bg-zinc-800 rounded-lg">
          <span class="text-zinc-400 text-sm">{{ formatDate(s.date) }}</span>
          <div class="flex items-center gap-2">
            <span v-if="s.isLead" class="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">責任者</span>
            <span class="text-white text-sm font-medium">{{ s.spotName }}</span>
          </div>
        </div>
      </div>
      <p v-else class="text-zinc-500 text-sm">今週の担当スポットはまだありません。</p>
    </div>

    <div class="border-t border-zinc-800 pt-5">
      <h3 class="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">今週のテーマ</h3>
      <div v-if="currentTheme">
        <p class="text-white font-semibold text-base">{{ currentTheme.title }}</p>
        <p v-if="currentTheme.body" class="mt-2 text-zinc-400 text-sm whitespace-pre-wrap" v-html="linkify(currentTheme.body)" />
      </div>
      <p v-else class="text-zinc-500 text-sm">今週のテーマはまだ設定されていません。</p>
    </div>
  </div>
</template>
