<script setup lang="ts">
import { ref, watch } from 'vue'
import { API, useApi } from '../../composables/useApi'

const props = defineProps<{ editingTheme: any | null }>()
const emit = defineEmits<{ saved: []; cancelled: [] }>()

const { authHeaders: auth } = useApi()

function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

const formWeekStart = ref(getWeekStart())
const formTitle = ref('')
const formBody = ref('')
const saving = ref(false)

watch(() => props.editingTheme, (theme) => {
  if (theme) {
    formWeekStart.value = theme.weekStart
    formTitle.value = theme.title
    formBody.value = theme.body ?? ''
  } else {
    formWeekStart.value = getWeekStart()
    formTitle.value = ''
    formBody.value = ''
  }
})

async function save() {
  if (!formTitle.value.trim()) return
  saving.value = true
  try {
    await fetch(`${API}/api/themes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({
        weekStart: formWeekStart.value,
        title: formTitle.value.trim(),
        body: formBody.value.trim() || null,
      }),
    })
    emit('saved')
  } finally {
    saving.value = false
  }
}

function cancel() {
  emit('cancelled')
}
</script>

<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
    <h4 class="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">
      {{ editingTheme ? 'テーマを編集' : '新しいテーマを作成' }}
    </h4>
    <form @submit.prevent="save" class="flex flex-col gap-4">
      <div class="flex items-center gap-3">
        <label class="text-sm text-zinc-400 w-16 shrink-0">週</label>
        <input
          v-model="formWeekStart"
          type="date"
          required
          class="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-violet-500 transition-colors scheme-dark"
        />
        <span class="text-xs text-zinc-500">（月曜日を選択）</span>
      </div>
      <div class="flex items-center gap-3">
        <label class="text-sm text-zinc-400 w-16 shrink-0">タイトル</label>
        <input
          v-model="formTitle"
          placeholder="今週のテーマ"
          required
          class="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
        />
      </div>
      <div class="flex gap-3">
        <label class="text-sm text-zinc-400 w-16 shrink-0 pt-2">説明</label>
        <textarea
          v-model="formBody"
          placeholder="補足説明（任意）"
          rows="3"
          class="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors resize-none"
        />
      </div>
      <div class="flex gap-2 justify-end">
        <button
          v-if="editingTheme"
          type="button"
          @click="cancel"
          class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors"
        >キャンセル</button>
        <button
          type="submit"
          :disabled="saving"
          class="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
        >{{ saving ? '保存中...' : (editingTheme ? '更新' : '作成') }}</button>
      </div>
    </form>
  </div>
</template>
