<script setup lang="ts">
import { useAuth } from '../store/auth'
import { currentView, setView } from '../store/nav'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { state } = useAuth()

const menuItems = [
  { id: 'dashboard', label: 'ダッシュボード', icon: 'dashboard' },
  { id: 'spots', label: 'スポット管理', icon: 'place', adminOnly: true },
  { id: 'themes', label: 'テーマ管理', icon: 'edit_note', adminOnly: true },
  { id: 'users', label: 'ユーザー管理', icon: 'group', adminOnly: true },
  { id: 'schedules', label: 'スケジュール管理', icon: 'event' },
  { id: 'rotation', label: 'ローテーション管理', icon: 'autorenew' },
  { id: 'profile', label: 'プロフィール', icon: 'person' },
]

const filteredItems = menuItems.filter(item => !item.adminOnly || state.user?.isAdmin)

function navigate(id: string) {
  setView(id)
  emit('close')
}
</script>

<template>
  <aside
    :class="[
      'w-60 bg-zinc-900 border-r border-zinc-800 flex flex-col h-screen',
      'fixed top-0 left-0 z-40 transition-transform duration-200',
      'md:sticky md:shrink-0 md:translate-x-0',
      open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
    ]"
  >
    <div class="px-5 py-5 border-b border-zinc-800 flex items-center justify-between">
      <h2 class="text-violet-400 font-bold text-base">PW-Assistant</h2>
      <button class="md:hidden text-zinc-400 hover:text-white" @click="emit('close')">
        <span class="material-icons text-[20px]">close</span>
      </button>
    </div>
    <nav class="flex-1 p-3 flex flex-col gap-1">
      <button
        v-for="item in filteredItems"
        :key="item.id"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full text-left transition-colors',
          currentView === item.id
            ? 'bg-violet-600/20 text-violet-400 font-medium'
            : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
        ]"
        @click="navigate(item.id)"
      >
        <span class="material-icons text-[18px]">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </button>
    </nav>
  </aside>
</template>
