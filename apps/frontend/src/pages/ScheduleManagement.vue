<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '../store/auth'
import { API, useApi } from '../composables/useApi'
import ScheduleOverview from '../components/schedule/ScheduleOverview.vue'
import ScheduleAssign from '../components/schedule/ScheduleAssign.vue'

const { state } = useAuth()
const { authHeaders: auth } = useApi()

const activeTab = ref<'overview' | 'assign'>('overview')
const spots = ref<any[]>([])
const users = ref<any[]>([])
const schedules = ref<any[]>([])

async function fetchSchedules() {
  const res = await fetch(`${API}/api/schedules`, { headers: auth() })
  schedules.value = await res.json()
}

async function init() {
  const [spotsRes, schedulesRes] = await Promise.all([
    fetch(`${API}/api/spots`, { headers: auth() }),
    fetch(`${API}/api/schedules`, { headers: auth() }),
  ])
  spots.value = await spotsRes.json()
  schedules.value = await schedulesRes.json()

  if (state.user?.isAdmin) {
    const usersRes = await fetch(`${API}/api/users`, { headers: auth() })
    users.value = await usersRes.json()
  }
}

onMounted(init)
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- タブ（配置調整は管理者のみ） -->
    <div class="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
      <button
        @click="activeTab = 'overview'"
        :class="[
          'px-5 py-1.5 rounded-lg text-sm font-medium transition-colors',
          activeTab === 'overview' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'
        ]"
      >概要</button>
      <button
        v-if="state.user?.isAdmin"
        @click="activeTab = 'assign'"
        :class="[
          'px-5 py-1.5 rounded-lg text-sm font-medium transition-colors',
          activeTab === 'assign' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'
        ]"
      >配置調整</button>
    </div>

    <ScheduleOverview v-if="activeTab === 'overview'" :spots="spots" :schedules="schedules" />
    <ScheduleAssign v-else :spots="spots" :users="users" :schedules="schedules" @saved="fetchSchedules" />
  </div>
</template>
