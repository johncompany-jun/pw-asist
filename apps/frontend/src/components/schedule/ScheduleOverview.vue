<script setup lang="ts">
import { ref, computed } from 'vue'
import { Gender } from '../../constants/gender'

const props = defineProps<{
  spots: any[]
  schedules: any[]
}>()

const today = new Date()
const calendarYear = ref(today.getFullYear())
const calendarMonth = ref(today.getMonth() + 1)
const selectedDate = ref(today.toISOString().slice(0, 10))

const calendarLabel = computed(() =>
  `${calendarYear.value}年 ${calendarMonth.value}月`
)

const calendarDays = computed(() => {
  const rawDay = new Date(calendarYear.value, calendarMonth.value - 1, 1).getDay()
  const firstDay = (rawDay + 6) % 7 // 月曜始まりに変換（日=0→6, 月=1→0, ...）
  const daysInMonth = new Date(calendarYear.value, calendarMonth.value, 0).getDate()
  const cells: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
})

function dateStr(day: number) {
  return `${calendarYear.value}-${String(calendarMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function isToday(day: number) { return dateStr(day) === today.toISOString().slice(0, 10) }
function isSelected(day: number) { return dateStr(day) === selectedDate.value }
function hasSchedule(day: number) { return scheduledDates.value.has(dateStr(day)) }

function prevMonth() {
  if (calendarMonth.value === 1) { calendarYear.value--; calendarMonth.value = 12 }
  else calendarMonth.value--
}

function nextMonth() {
  if (calendarMonth.value === 12) { calendarYear.value++; calendarMonth.value = 1 }
  else calendarMonth.value++
}

// カレンダーのドット表示用（現在月に予定がある日）
const scheduledDates = computed(() => {
  const prefix = `${calendarYear.value}-${String(calendarMonth.value).padStart(2, '0')}`
  return new Set(props.schedules.filter(s => s.date.startsWith(prefix)).map(s => s.date))
})

// 選択日のスケジュール
const daySchedules = computed(() =>
  props.schedules.filter(s => s.date === selectedDate.value)
)

const spotCards = computed(() =>
  props.spots
    .map(spot => {
      const schedInSpot = daySchedules.value.filter(s => s.spotId === spot.id)
      const assigned = schedInSpot
        .map(s => ({ id: s.userId, name: s.userName, gender: s.userGender, isLead: s.isLead }))
        .sort((a: any, b: any) => (b.isLead ? 1 : 0) - (a.isLead ? 1 : 0))
      return { spot, assigned }
    })
    .filter(c => c.assigned.length > 0)
)

const offUsers = computed(() =>
  daySchedules.value
    .filter(s => s.spotId === null)
    .map(s => ({ id: s.userId, name: s.userName, gender: s.userGender }))
)
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="text-white font-semibold">{{ selectedDate }} のスケジュール</div>

    <div class="flex gap-5 items-stretch flex-wrap">

      <!-- カレンダー -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5 w-full sm:w-72 sm:shrink-0">
        <div class="flex items-center justify-between mb-4">
          <button @click="prevMonth" class="text-zinc-400 hover:text-white transition-colors p-1">
            <span class="material-icons text-[18px]">chevron_left</span>
          </button>
          <span class="text-white font-semibold text-sm">{{ calendarLabel }}</span>
          <button @click="nextMonth" class="text-zinc-400 hover:text-white transition-colors p-1">
            <span class="material-icons text-[18px]">chevron_right</span>
          </button>
        </div>
        <div class="grid grid-cols-7 mb-1">
          <div
            v-for="w in ['月','火','水','木','金','土','日']"
            :key="w"
            class="text-center text-xs text-zinc-500 py-1"
          >{{ w }}</div>
        </div>
        <div class="grid grid-cols-7 gap-y-1">
          <div v-for="(day, i) in calendarDays" :key="i" class="flex justify-center">
            <button
              v-if="day"
              @click="selectedDate = dateStr(day)"
              :class="[
                'w-8 h-8 rounded-full text-xs flex flex-col items-center justify-center relative transition-colors',
                isSelected(day) ? 'bg-violet-600 text-white' :
                isToday(day) ? 'ring-1 ring-violet-500 text-violet-400 hover:bg-zinc-800' :
                'text-zinc-300 hover:bg-zinc-800'
              ]"
            >
              {{ day }}
              <span
                v-if="hasSchedule(day) && !isSelected(day)"
                class="absolute bottom-0.5 w-1 h-1 rounded-full bg-violet-400"
              />
            </button>
            <div v-else class="w-8 h-8" />
          </div>
        </div>
      </div>

      <!-- 選択日の概要 -->
      <div class="flex-1 min-w-0">
        <div v-if="daySchedules.length === 0" class="text-zinc-500 text-sm">この日のスケジュールはありません</div>

        <div v-else class="flex flex-wrap gap-3">
          <div
            v-for="{ spot, assigned } in spotCards"
            :key="spot.id"
            class="bg-zinc-800 border border-zinc-700 rounded-xl p-4 min-w-40"
          >
            <div class="font-semibold text-white text-sm mb-1">{{ spot.name }}</div>
            <div class="flex gap-2 text-xs mb-3">
              <span class="text-blue-400">男{{ assigned.filter((u:any) => u.gender === Gender.MALE).length }}</span>
              <span class="text-pink-400">女{{ assigned.filter((u:any) => u.gender === Gender.FEMALE).length }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <div
                v-for="u in assigned"
                :key="u.id"
                class="flex items-center gap-1.5 text-xs text-zinc-300"
              >
                <span :class="['w-1 h-4 rounded-full shrink-0', u.gender === Gender.MALE ? 'bg-blue-400' : 'bg-pink-400']" />
                <span>{{ u.name }}</span>
                <span v-if="u.isLead && u.gender === Gender.MALE" class="ml-auto text-[10px] px-1 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">責任者</span>
              </div>
            </div>
          </div>

          <!-- 休みカード -->
          <div v-if="offUsers.length > 0" class="bg-zinc-800 border border-zinc-700 rounded-xl p-4 min-w-40">
            <div class="font-semibold text-red-400 text-sm mb-1">休み</div>
            <div class="flex gap-2 text-xs mb-3">
              <span class="text-blue-400">男{{ offUsers.filter((u:any) => u.gender === Gender.MALE).length }}</span>
              <span class="text-pink-400">女{{ offUsers.filter((u:any) => u.gender === Gender.FEMALE).length }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <div
                v-for="u in offUsers"
                :key="u.id"
                class="flex items-center gap-1.5 text-xs text-zinc-300"
              >
                <span :class="['w-1 h-4 rounded-full shrink-0', u.gender === Gender.MALE ? 'bg-blue-400' : 'bg-pink-400']" />
                {{ u.name }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
