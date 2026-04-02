<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { API, useApi } from '../../composables/useApi'
import { Gender } from '../../constants/gender'

const props = defineProps<{
  date: string
  spotId: number
  assignedUsers: any[]
  canEdit: boolean
  rotation: any | null
}>()

const emit = defineEmits<{ saved: [] }>()

const { authHeaders: auth } = useApi()

const startsAt = ref('10:00')
const endsAt = ref('13:00')
const intervalMinutes = ref<10 | 15 | 20>(15)
const grid = ref<Record<number, Record<number, string>>>({})
const localUsers = ref<any[]>([])
const saving = ref(false)
const saveError = ref('')

const dutyOptions = [
  { value: 'service', label: '奉仕', color: 'bg-violet-600/20 text-violet-300 border-violet-500/40' },
  { value: 'watching', label: '見守り', color: 'bg-blue-600/20 text-blue-300 border-blue-500/40' },
  { value: 'break', label: '休憩', color: 'bg-zinc-700 text-zinc-400 border-zinc-600' },
]

const timeSlots = computed(() => {
  if (!startsAt.value || !endsAt.value || !intervalMinutes.value) return []
  const [sh, sm] = startsAt.value.split(':').map(Number)
  const [eh, em] = endsAt.value.split(':').map(Number)
  const startMin = sh * 60 + sm
  const endMin = eh * 60 + em
  const slots: string[] = []
  for (let m = startMin; m < endMin; m += intervalMinutes.value) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0')
    const mm = String(m % 60).padStart(2, '0')
    slots.push(`${hh}:${mm}`)
  }
  return slots
})

function getDuty(slotIndex: number, userId: number): string {
  return grid.value[slotIndex]?.[userId] ?? ''
}

function cycleDuty(slotIndex: number, userId: number) {
  if (!props.canEdit) return
  const current = getDuty(slotIndex, userId)
  const duties = ['service', 'watching', 'break', '']
  const next = duties[(duties.indexOf(current) + 1) % duties.length]
  if (!grid.value[slotIndex]) grid.value[slotIndex] = {}
  if (next === '') delete grid.value[slotIndex][userId]
  else grid.value[slotIndex][userId] = next
  grid.value = { ...grid.value }
}

function dutyStyle(duty: string) { return dutyOptions.find(d => d.value === duty)?.color ?? '' }
function dutyLabel(duty: string) { return dutyOptions.find(d => d.value === duty)?.label ?? '' }

async function save() {
  if (!props.canEdit) return
  saving.value = true
  saveError.value = ''
  try {
    const slots: any[] = []
    for (const [slotIndexStr, users] of Object.entries(grid.value)) {
      for (const [userIdStr, duty] of Object.entries(users)) {
        slots.push({ slotIndex: Number(slotIndexStr), userId: Number(userIdStr), duty })
      }
    }
    const res = await fetch(`${API}/api/rotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({
        date: props.date,
        spotId: props.spotId,
        startsAt: startsAt.value,
        endsAt: endsAt.value,
        intervalMinutes: intervalMinutes.value,
        slots,
        userOrder: localUsers.value.map(u => u.id),
      }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      saveError.value = body.message ?? `保存に失敗しました (${res.status})`
      return
    }
    emit('saved')
  } catch {
    saveError.value = '通信エラーが発生しました'
  } finally {
    saving.value = false
  }
}

// rotation が変わったら設定値・グリッドを復元
watch(() => props.rotation, (data) => {
  if (data) {
    startsAt.value = data.startsAt
    endsAt.value = data.endsAt
    intervalMinutes.value = data.intervalMinutes
    const g: Record<number, Record<number, string>> = {}
    for (const slot of data.slots) {
      if (!g[slot.slotIndex]) g[slot.slotIndex] = {}
      g[slot.slotIndex][slot.userId] = slot.duty
    }
    grid.value = g
  } else {
    grid.value = {}
  }
}, { immediate: true })

// assignedUsers が変わったらユーザー順を更新（保存済み順があれば尊重）
watch(() => props.assignedUsers, (users) => {
  if (props.rotation?.userOrder) {
    const order: number[] = JSON.parse(props.rotation.userOrder)
    localUsers.value = [
      ...order.map((id: number) => users.find(u => u.id === id)).filter(Boolean),
      ...users.filter(u => !order.includes(u.id)),
    ]
  } else {
    localUsers.value = [...users]
  }
}, { immediate: true })
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- 設定バー -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2">
        <label class="text-xs text-zinc-400">開始</label>
        <input
          v-model="startsAt"
          type="time"
          :disabled="!canEdit"
          class="px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 disabled:opacity-50"
        />
      </div>
      <div class="flex items-center gap-2">
        <label class="text-xs text-zinc-400">終了</label>
        <input
          v-model="endsAt"
          type="time"
          :disabled="!canEdit"
          class="px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 disabled:opacity-50"
        />
      </div>
      <div class="flex items-center gap-2">
        <label class="text-xs text-zinc-400">間隔</label>
        <select
          v-model="intervalMinutes"
          :disabled="!canEdit"
          class="px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 disabled:opacity-50"
        >
          <option :value="10">10分</option>
          <option :value="15">15分</option>
          <option :value="20">20分</option>
        </select>
      </div>
      <div class="flex-1" />
      <div v-if="saveError" class="text-red-400 text-xs">{{ saveError }}</div>
      <button
        v-if="canEdit"
        @click="save"
        :disabled="saving"
        class="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        {{ saving ? '保存中...' : '保存' }}
      </button>
      <span v-else class="text-xs text-zinc-500">閲覧のみ</span>
    </div>

    <!-- ユーザーなし -->
    <div v-if="localUsers.length === 0" class="text-zinc-500 text-sm">
      このスポットにアサインされたメンバーがいません。
    </div>

    <!-- グリッド -->
    <div v-else-if="timeSlots.length > 0" class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-auto">
      <table class="text-sm border-collapse">
        <thead class="sticky top-0 z-10">
          <tr>
            <th class="sticky left-0 z-20 bg-zinc-900 px-4 py-3 text-left text-zinc-400 font-medium border-b border-r border-zinc-800 min-w-32">氏名</th>
            <th
              v-for="(slot, i) in timeSlots"
              :key="i"
              class="px-3 py-3 text-center text-zinc-400 font-medium border-b border-zinc-800 min-w-20 bg-zinc-900 whitespace-nowrap"
            >{{ slot }}</th>
          </tr>
        </thead>
        <VueDraggable v-model="localUsers" :animation="150" tag="tbody" handle=".drag-handle">
          <tr
            v-for="user in localUsers"
            :key="user.id"
            class="border-b border-zinc-800 last:border-0"
          >
            <td class="sticky left-0 bg-zinc-900 px-4 py-2.5 border-r border-zinc-800">
              <div class="flex items-center gap-1.5">
                <span class="drag-handle material-icons text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing select-none" style="font-size:16px">drag_indicator</span>
                <span :class="['w-1 h-4 rounded-full shrink-0', user.gender === Gender.MALE ? 'bg-blue-400' : 'bg-pink-400']" />
                <span class="text-white text-xs whitespace-nowrap">{{ user.name }}</span>
              </div>
            </td>
            <td
              v-for="(_, slotIndex) in timeSlots"
              :key="slotIndex"
              class="px-1.5 py-1.5 text-center"
            >
              <button
                @click="cycleDuty(slotIndex, user.id)"
                :disabled="!canEdit"
                :class="[
                  'w-full px-1 py-1 rounded border text-[11px] font-medium transition-colors',
                  getDuty(slotIndex, user.id)
                    ? dutyStyle(getDuty(slotIndex, user.id))
                    : 'bg-transparent border-zinc-700 text-zinc-600 hover:border-zinc-500',
                  canEdit ? 'cursor-pointer' : 'cursor-default'
                ]"
              >
                {{ getDuty(slotIndex, user.id) ? dutyLabel(getDuty(slotIndex, user.id)) : '―' }}
              </button>
            </td>
          </tr>
        </VueDraggable>
      </table>
    </div>

    <div v-else class="text-zinc-500 text-sm">開始・終了時刻と間隔を設定してください。</div>

    <!-- 凡例 -->
    <div class="flex gap-3 text-xs">
      <span v-for="d in dutyOptions" :key="d.value" :class="['px-2 py-0.5 rounded border', d.color]">{{ d.label }}</span>
      <span class="text-zinc-500">クリックで切り替え（責任者のみ）</span>
    </div>
  </div>
</template>
