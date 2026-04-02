<script setup lang="ts">
import { ref } from 'vue'
import { API, useApi } from '../../composables/useApi'

const emit = defineEmits<{ created: [] }>()

const { authHeaders: auth } = useApi()

const DEFAULT_PASSWORD = 'SmpwFa10'

type ResultRow = { email: string; ok: boolean; error?: string }

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const results = ref<ResultRow[] | null>(null)

function parseCsv(text: string): { email: string; name: string; gender: string; password: string }[] {
  const lines = text.trim().split(/\r?\n/)
  const header = lines[0].split(',').map(h => h.trim())
  const emailIdx = header.indexOf('email')
  const nameIdx = header.indexOf('name')
  const genderIdx = header.indexOf('gender')
  if (emailIdx === -1 || nameIdx === -1 || genderIdx === -1) {
    throw new Error('CSVヘッダーに email, name, gender が必要です')
  }
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const cols = line.split(',').map(c => c.trim())
    return {
      email: cols[emailIdx],
      name: cols[nameIdx],
      gender: cols[genderIdx],
      password: DEFAULT_PASSWORD,
    }
  })
}

async function handleFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  results.value = null
  uploading.value = true
  try {
    const text = await file.text()
    const rows = parseCsv(text)
    const res = await fetch(`${API}/api/users/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({ rows }),
    })
    results.value = await res.json()
    if (results.value!.some(r => r.ok)) emit('created')
  } catch (e: any) {
    results.value = [{ email: '', ok: false, error: e.message }]
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>

<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
    <h4 class="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">CSVで一括登録</h4>
    <p class="text-xs text-zinc-500 mb-3">ヘッダー行: <code class="text-zinc-400">email,name,gender</code>　（gender は <code class="text-zinc-400">male</code> / <code class="text-zinc-400">female</code>）</p>
    <label class="inline-flex items-center gap-3 cursor-pointer">
      <span class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors">
        {{ uploading ? 'アップロード中...' : 'CSVを選択' }}
      </span>
      <input
        ref="fileInput"
        type="file"
        accept=".csv"
        class="hidden"
        :disabled="uploading"
        @change="handleFile"
      />
    </label>

    <!-- 結果 -->
    <div v-if="results" class="mt-4 flex flex-col gap-1">
      <div
        v-for="r in results"
        :key="r.email"
        :class="['text-xs px-3 py-1.5 rounded-lg border', r.ok ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30']"
      >
        <span v-if="r.ok">✓ {{ r.email }}</span>
        <span v-else>✗ {{ r.email || '(不明)' }} — {{ r.error }}</span>
      </div>
    </div>
  </div>
</template>
