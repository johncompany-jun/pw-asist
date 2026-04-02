<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAuth } from '../store/auth'
import { API, useApi } from '../composables/useApi'
import { useNotify } from '../composables/useNotify'
import RotationGrid from '../components/rotation/RotationGrid.vue'

const { state } = useAuth()
const { authHeaders: auth } = useApi()

const today = new Date().toISOString().slice(0, 10)
const selectedDate = ref(today)
const spots = ref<any[]>([])
const myLeadSpots = ref<any[]>([])
const spotLeads = ref<Record<number, { userId: number; userName: string }>>({})
const selectedSpotId = ref<number | null>(null)
const assignedUsers = ref<any[]>([])
const rotation = ref<any | null>(null)
const canEdit = ref(false)
const loading = ref(false)

const { showModal: showNotifyModal, message: notifyMessage, admins: notifyAdmins, selectedAdminIds: notifySelectedAdminIds, sending: notifySending, result: notifyResult, open: openNotifyModal, close: closeNotifyModal, send: sendNotify, toggleAdmin: toggleNotifyAdmin } = useNotify(
  () => rotation.value?.id,
  () => selectedDate.value,
  () => state.user?.name ?? '',
)

async function fetchSpots() {
  const res = await fetch(`${API}/api/spots`, { headers: auth() })
  spots.value = await res.json()
}

async function fetchMyLeadSpots() {
  const res = await fetch(`${API}/api/schedules`, { headers: auth() })
  const all: any[] = await res.json()
  const todaySchedules = all.filter(s => s.date === selectedDate.value)

  myLeadSpots.value = todaySchedules.filter(s => s.isLead && s.userId === state.user?.id)

  const leads: Record<number, { userId: number; userName: string }> = {}
  for (const s of todaySchedules.filter(s => s.isLead)) {
    if (s.userId && s.userName) leads[s.spotId] = { userId: s.userId, userName: s.userName }
  }
  spotLeads.value = leads

  if (!state.user?.isAdmin) {
    const mySpotIds = new Set(todaySchedules.filter(s => s.userId === state.user?.id && s.spotId).map(s => s.spotId))
    spots.value = spots.value.filter(sp => mySpotIds.has(sp.id))
  }
}

async function fetchAssignedUsers(spotId: number) {
  const res = await fetch(`${API}/api/schedules`, { headers: auth() })
  const all: any[] = await res.json()
  const inSpot = all.filter(s => s.date === selectedDate.value && s.spotId === spotId)
  assignedUsers.value = inSpot.map(s => ({ id: s.userId, name: s.userName, gender: s.userGender }))
  const myEntry = inSpot.find(s => s.userId === state.user?.id && s.isLead)
  canEdit.value = !!state.user?.isAdmin || !!myEntry
}

async function fetchRotation() {
  if (!selectedSpotId.value) return
  loading.value = true
  try {
    const res = await fetch(
      `${API}/api/rotations?date=${selectedDate.value}&spotId=${selectedSpotId.value}`,
      { headers: auth() }
    )
    const data = await res.json()
    rotation.value = data
    if (data) canEdit.value = data.canEdit
  } finally {
    loading.value = false
  }
}

async function selectSpot(spotId: number) {
  selectedSpotId.value = spotId
  await fetchAssignedUsers(spotId)
  await fetchRotation()
}

async function init() {
  await fetchSpots()
  await fetchMyLeadSpots()
  if (myLeadSpots.value.length > 0) {
    await selectSpot(myLeadSpots.value[0].spotId)
  } else if (!state.user?.isAdmin && spots.value.length > 0) {
    await selectSpot(spots.value[0].id)
  }
}

watch(selectedDate, async () => {
  selectedSpotId.value = null
  rotation.value = null
  assignedUsers.value = []
  canEdit.value = false
  await fetchSpots()
  await fetchMyLeadSpots()
  if (myLeadSpots.value.length > 0) {
    await selectSpot(myLeadSpots.value[0].spotId)
  } else if (!state.user?.isAdmin && spots.value.length > 0) {
    await selectSpot(spots.value[0].id)
  }
})

onMounted(init)
</script>

<template>
  <div class="flex flex-col gap-5">

    <!-- 日付選択 -->
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
      <label class="text-sm text-zinc-400 shrink-0">日付</label>
      <input
        v-model="selectedDate"
        type="date"
        class="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-violet-500 transition-colors scheme-dark"
      />
    </div>

    <!-- 一般ユーザー: スポット表示 -->
    <div v-if="!state.user?.isAdmin && selectedSpotId" class="flex items-center gap-2">
      <span class="text-xs text-zinc-400">スポット</span>
      <span class="px-3 py-1.5 bg-violet-600/20 border border-violet-500/40 text-violet-300 text-sm font-medium rounded-lg">
        {{ spots.find(s => s.id === selectedSpotId)?.name }}
      </span>
    </div>

    <!-- スポット選択（管理者のみ） -->
    <div v-if="state.user?.isAdmin" class="flex gap-3 flex-wrap">
      <button
        v-for="spot in spots"
        :key="spot.id"
        @click="selectSpot(spot.id)"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
          selectedSpotId === spot.id
            ? 'bg-violet-600 border-violet-600 text-white'
            : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-violet-500 hover:text-white'
        ]"
      >
        {{ spot.name }}
        <template v-if="spotLeads[spot.id]">
          <span class="ml-1.5 text-[10px] px-1 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">責任者</span>
          <span class="ml-1 text-[11px] text-amber-300">{{ spotLeads[spot.id].userName }}</span>
        </template>
      </button>
    </div>

    <div v-if="!selectedSpotId && state.user?.isAdmin" class="text-zinc-500 text-sm">スポットを選択してください。</div>
    <div v-else-if="loading" class="text-zinc-500 text-sm py-8 text-center">読み込み中...</div>

    <div v-else-if="selectedSpotId" class="flex flex-col gap-4">
      <!-- メール送信ボタン -->
      <div v-if="canEdit && rotation" class="flex justify-end">
        <button
          @click="openNotifyModal"
          class="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-violet-500 hover:text-white rounded-lg text-sm transition-colors"
        >
          <span class="material-icons text-[16px]">mail</span>
          メンバーにメールを送る
        </button>
      </div>

      <RotationGrid
        :date="selectedDate"
        :spot-id="selectedSpotId"
        :assigned-users="assignedUsers"
        :can-edit="canEdit"
        :rotation="rotation"
        @saved="fetchRotation"
      />
    </div>

    <!-- メール送信モーダル -->
    <div v-if="showNotifyModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div class="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md mx-4">
        <div class="text-white font-semibold mb-1">メンバーへのメール送信</div>
        <div class="text-zinc-500 text-xs mb-4">
          {{ selectedDate }} ・ {{ spots.find(s => s.id === selectedSpotId)?.name }} の全メンバーに送信します
        </div>
        <textarea
          v-model="notifyMessage"
          placeholder="メッセージ（任意）"
          rows="4"
          class="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-violet-500 resize-none transition-colors"
        />
        <div v-if="notifyAdmins.length > 0" class="mt-3">
          <div class="text-xs text-zinc-400 mb-2">管理者をCCに含める</div>
          <div class="flex flex-col gap-1.5">
            <label
              v-for="admin in notifyAdmins"
              :key="admin.id"
              class="flex items-center gap-2 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                :checked="notifySelectedAdminIds.includes(admin.id)"
                @change="toggleNotifyAdmin(admin.id)"
                class="accent-violet-500"
              />
              <span class="text-sm text-zinc-300">{{ admin.name }}</span>
            </label>
          </div>
        </div>
        <div v-if="notifyResult" :class="['mt-2 text-sm', notifyResult.includes('送信しました') ? 'text-green-400' : 'text-red-400']">
          {{ notifyResult }}
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <button
            @click="closeNotifyModal"
            class="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            :disabled="notifySending"
          >キャンセル</button>
          <button
            @click="sendNotify"
            :disabled="notifySending"
            class="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
          >{{ notifySending ? '送信中...' : '送信' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
