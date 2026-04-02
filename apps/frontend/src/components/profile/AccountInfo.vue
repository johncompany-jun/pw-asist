<script setup lang="ts">
import { useAuth } from '../../store/auth'

const { state } = useAuth()
</script>

<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
    <h4 class="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">アカウント情報</h4>
    <div class="flex flex-col gap-2 text-sm">
      <div class="flex gap-3">
        <span class="text-zinc-500 w-24">名前</span>
        <span class="text-white">{{ state.user?.name }}</span>
      </div>
      <div class="flex gap-3">
        <span class="text-zinc-500 w-24">メール</span>
        <span class="text-white">{{ state.user?.email }}</span>
      </div>
      <div class="flex gap-3">
        <span class="text-zinc-500 w-24">権限</span>
        <span :class="state.user?.isAdmin ? 'text-emerald-400' : 'text-blue-400'">
          {{ state.user?.isAdmin ? '管理者' : '一般' }}
        </span>
      </div>
    </div>
  </div>
</template>
