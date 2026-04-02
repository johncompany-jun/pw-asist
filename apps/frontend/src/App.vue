<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuth } from './store/auth'
import { currentView } from './store/nav'
import Login from './pages/Login.vue'
import Dashboard from './pages/Dashboard.vue'
import UserManagement from './pages/UserManagement.vue'
import SpotManagement from './pages/SpotManagement.vue'
import Profile from './pages/Profile.vue'
import ScheduleManagement from './pages/ScheduleManagement.vue'
import RotationManagement from './pages/RotationManagement.vue'
import ThemeManagement from './pages/ThemeManagement.vue'
import Sidebar from './components/Sidebar.vue'

const { state, logout } = useAuth()
const sidebarOpen = ref(false)

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    dashboard: 'ダッシュボード',
    users: 'ユーザー管理',
    spots: 'スポット管理',
    themes: 'テーマ管理',
    schedules: 'スケジュール管理',
    rotation: 'ローテーション管理',
    profile: 'プロフィール',
  }
  return titles[currentView.value] ?? ''
})
</script>

<template>
  <div v-if="!state.token" class="min-h-screen bg-zinc-950">
    <Login />
  </div>

  <div v-else class="flex min-h-screen bg-zinc-950">
    <!-- モバイル用バックドロップ -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-30 bg-black/50 md:hidden"
      @click="sidebarOpen = false"
    />

    <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <div class="flex flex-col flex-1 min-w-0">
      <header class="flex items-center justify-between px-4 md:px-8 py-4 bg-zinc-900 border-b border-zinc-800 shrink-0 sticky top-0 z-20">
        <div class="flex items-center gap-3">
          <button class="md:hidden text-zinc-400 hover:text-white" @click="sidebarOpen = true">
            <span class="material-icons text-[24px]">menu</span>
          </button>
          <span class="font-semibold text-white">{{ pageTitle }}</span>
        </div>
        <div class="flex items-center gap-2 md:gap-4 text-sm">
          <span class="hidden md:inline text-zinc-400">ログイン中: <strong class="text-white">{{ state.user?.name }}</strong></span>
          <button
            @click="logout"
            class="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-lg transition-colors"
          >
            ログアウト
          </button>
        </div>
      </header>

      <main class="flex-1 p-4 md:p-8 w-full max-w-6xl mx-auto">
        <Dashboard v-if="currentView === 'dashboard'" />
        <ThemeManagement v-else-if="currentView === 'themes' && state.user?.isAdmin" />
        <UserManagement v-else-if="currentView === 'users' && state.user?.isAdmin" />
        <SpotManagement v-else-if="currentView === 'spots'" />
        <Profile v-else-if="currentView === 'profile'" />
        <ScheduleManagement v-else-if="currentView === 'schedules'" />
        <RotationManagement v-else-if="currentView === 'rotation'" />
      </main>
    </div>
  </div>
</template>
