<script setup lang="ts">
import { ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { API, useApi } from '../../composables/useApi'
import { Gender } from '../../constants/gender'

interface KanbanUser {
  id: number
  name: string
  gender: string
  isLead: boolean
  scheduleId?: number
}

interface KanbanColumn {
  key: string
  label: string
  spotId: number | null | 'unassigned'
  users: KanbanUser[]
}

const props = defineProps<{
  spots: any[]
  users: any[]
  schedules: any[]
}>()

const emit = defineEmits<{ saved: [] }>()

const { authHeaders: auth } = useApi()

const assignDate = ref(new Date().toISOString().slice(0, 10))
const kanbanColumns = ref<KanbanColumn[]>([])
const saving = ref(false)

function buildKanban() {
  const dateSchedules = props.schedules.filter(s => s.date === assignDate.value)

  const cols: KanbanColumn[] = [
    { key: 'unassigned', label: '未アサイン', spotId: 'unassigned', users: [] },
    ...props.spots.map(spot => ({
      key: `spot-${spot.id}`,
      label: spot.name,
      spotId: spot.id as number,
      users: [] as KanbanUser[],
    })),
    { key: 'off', label: '休み', spotId: null, users: [] },
  ]

  for (const user of props.users) {
    const schedule = dateSchedules.find(s => s.userId === user.id)
    const ku: KanbanUser = {
      id: user.id,
      name: user.name,
      gender: user.gender,
      isLead: schedule?.isLead ?? false,
      scheduleId: schedule?.id,
    }
    if (!schedule) cols[0].users.push(ku)
    else if (schedule.spotId === null) cols[cols.length - 1].users.push(ku)
    else {
      const col = cols.find(c => c.spotId === schedule.spotId)
      if (col) col.users.push(ku)
      else cols[0].users.push(ku)
    }
  }

  kanbanColumns.value = cols
}

function toggleLead(col: KanbanColumn, user: KanbanUser) {
  if (col.spotId === 'unassigned' || col.spotId === null) return
  col.users.forEach(u => { u.isLead = false })
  user.isLead = true
}

function countByGender(col: KanbanColumn, gender: string) {
  return col.users.filter(u => u.gender === gender).length
}

async function saveAll() {
  saving.value = true
  try {
    const promises: Promise<any>[] = []
    for (const col of kanbanColumns.value) {
      if (col.spotId === 'unassigned') {
        for (const user of col.users) {
          if (user.scheduleId) {
            promises.push(fetch(`${API}/api/schedules/${user.scheduleId}`, { method: 'DELETE', headers: auth() }))
          }
        }
      } else {
        for (const user of col.users) {
          promises.push(fetch(`${API}/api/schedules`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...auth() },
            body: JSON.stringify({ date: assignDate.value, spotId: col.spotId, userId: user.id, isLead: user.isLead }),
          }))
        }
      }
    }
    await Promise.all(promises)
    emit('saved')
  } finally {
    saving.value = false
  }
}

watch([() => props.schedules, () => props.spots, () => props.users, assignDate], buildKanban, { immediate: true })
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- 日付選択 + 保存 -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
      <label class="text-sm text-zinc-400 shrink-0">日付</label>
      <input
        v-model="assignDate"
        type="date"
        class="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-violet-500 transition-colors scheme-dark"
      />
      <div class="flex-1" />
      <button
        @click="saveAll"
        :disabled="saving"
        class="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        {{ saving ? '保存中...' : '保存' }}
      </button>
    </div>

    <!-- Kanbanボード -->
    <div class="flex gap-3 items-start">
      <!-- 未アサイン列（固定） -->
      <div v-if="kanbanColumns[0]" class="flex flex-col w-44 shrink-0 sticky left-0 top-4 z-10">
        <div class="rounded-t-xl px-3 py-2.5 border border-b-0 bg-zinc-800 border-zinc-700">
          <div class="font-semibold text-sm text-zinc-400">{{ kanbanColumns[0].label }}</div>
          <div class="text-xs text-zinc-500 mt-0.5">{{ kanbanColumns[0].users.length }}人</div>
        </div>
        <VueDraggable
          v-model="kanbanColumns[0].users"
          group="users"
          class="flex flex-col gap-1.5 overflow-y-auto min-h-20 max-h-[calc(100vh-280px)] p-2 rounded-b-xl border border-t-0 bg-zinc-800/50 border-zinc-700"
        >
          <div
            v-for="user in kanbanColumns[0].users"
            :key="user.id"
            class="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 cursor-grab active:cursor-grabbing select-none"
          >
            <span :class="['w-1 self-stretch rounded-full shrink-0', user.gender === Gender.MALE ? 'bg-blue-400' : 'bg-pink-400']" />
            <span class="text-xs text-zinc-200 flex-1 min-w-0 truncate">{{ user.name }}</span>
          </div>
        </VueDraggable>
      </div>

      <!-- スポット + 休み列（スクロール） -->
      <div class="flex gap-3 overflow-x-auto pb-2 flex-1 min-w-0">
        <div
          v-for="col in kanbanColumns.slice(1)"
          :key="col.key"
          class="flex flex-col w-44 shrink-0"
        >
          <div :class="[
            'rounded-t-xl px-3 py-2.5 border border-b-0',
            col.spotId === null ? 'bg-red-500/10 border-red-500/30' : 'bg-violet-600/10 border-violet-500/30'
          ]">
            <div :class="['font-semibold text-sm', col.spotId === null ? 'text-red-400' : 'text-violet-300']">{{ col.label }}</div>
            <div class="flex gap-2 text-xs mt-0.5">
              <span class="text-blue-400">男{{ countByGender(col, Gender.MALE) }}</span>
              <span class="text-pink-400">女{{ countByGender(col, Gender.FEMALE) }}</span>
            </div>
          </div>
          <VueDraggable
            v-model="col.users"
            group="users"
            :class="[
              'flex flex-col gap-1.5 flex-1 min-h-20 p-2 rounded-b-xl border border-t-0',
              col.spotId === null ? 'bg-red-500/5 border-red-500/30' : 'bg-violet-600/5 border-violet-500/30'
            ]"
          >
            <div
              v-for="user in col.users"
              :key="user.id"
              class="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 cursor-grab active:cursor-grabbing select-none"
            >
              <span :class="['w-1 self-stretch rounded-full shrink-0', user.gender === Gender.MALE ? 'bg-blue-400' : 'bg-pink-400']" />
              <span class="text-xs text-zinc-200 flex-1 min-w-0 truncate">{{ user.name }}</span>
              <button
                v-if="col.spotId !== null && user.gender === Gender.MALE"
                @click="toggleLead(col, user)"
                :title="user.isLead ? '責任者を解除' : '責任者に設定'"
                :class="[
                  'shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-colors',
                  user.isLead ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-700 text-zinc-500 hover:bg-zinc-600'
                ]"
              >
                <span class="material-icons text-[10px]">star</span>
              </button>
            </div>
          </VueDraggable>
        </div>
      </div>
    </div>

    <p class="text-xs text-zinc-500">ユーザーカードをドラッグしてスポットを変更。★ で責任者を設定。完了後「保存」を押してください。</p>
  </div>
</template>
