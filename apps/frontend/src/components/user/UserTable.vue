<script setup lang="ts">
import { ref, computed } from 'vue'
import { API, useApi } from '../../composables/useApi'
import { useAuth } from '../../store/auth'
import { GenderLabel } from '../../constants/gender'

const props = defineProps<{ users: any[]; loading: boolean; error: string }>()
const emit = defineEmits<{ deleted: []; updated: [] }>()

const query = ref('')
const editingId = ref<number | null>(null)
const editName = ref('')
const editEmail = ref('')
const editIsAdmin = ref(false)
const editGender = ref('')

function startEdit(user: any) {
  editingId.value = user.id
  editName.value = user.name
  editEmail.value = user.email
  editIsAdmin.value = user.isAdmin
  editGender.value = user.gender
}

function cancelEdit() {
  editingId.value = null
}

async function saveEdit(id: number) {
  try {
    const res = await fetch(`${API}/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({ name: editName.value, email: editEmail.value, isAdmin: editIsAdmin.value }),
    })
    if (!res.ok) throw new Error('更新に失敗しました')
    editingId.value = null
    emit('updated')
  } catch (e: any) {
    alert(e.message)
  }
}

const filteredUsers = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.users
  return props.users.filter(u =>
    u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  )
})

const { state } = useAuth()
const { authHeaders: auth } = useApi()

async function deleteUser(id: number) {
  if (!confirm('本当に削除しますか？')) return
  try {
    const res = await fetch(`${API}/api/users/${id}`, {
      method: 'DELETE',
      headers: auth(),
    })
    if (!res.ok) throw new Error('ユーザーの削除に失敗しました')
    emit('deleted')
  } catch (e: any) {
    alert(e.message)
  }
}
</script>

<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
    <div class="px-6 py-4 border-b border-zinc-800">
      <input
        v-model="query"
        placeholder="名前・メールアドレスで検索"
        class="w-full sm:w-72 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 transition-colors"
      />
    </div>
    <div v-if="loading" class="p-8 text-center text-zinc-500 text-sm">読み込み中...</div>
    <div v-else-if="error" class="p-8 text-center text-red-400 text-sm">{{ error }}</div>
    <div v-else class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-zinc-800">
          <th class="text-left px-4 py-3 text-zinc-400 font-medium sticky left-0 bg-zinc-900 z-10 min-w-30">名前</th>
          <th class="text-left px-4 py-3 text-zinc-400 font-medium min-w-45">メールアドレス</th>
          <th class="text-left px-4 py-3 text-zinc-400 font-medium min-w-15">性別</th>
          <th class="text-left px-4 py-3 text-zinc-400 font-medium min-w-17.5">権限</th>
          <th class="text-left px-4 py-3 text-zinc-400 font-medium min-w-22.5">登録日</th>
          <th class="px-4 py-3 min-w-30"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in filteredUsers" :key="user.id" class="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50 transition-colors">
          <td class="px-4 py-4 text-white font-medium sticky left-0 bg-zinc-900 hover:bg-zinc-800/50 z-10 min-w-30">
            <template v-if="editingId === user.id">
              <input v-model="editName" class="px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-white text-sm w-28 focus:outline-none focus:border-violet-500" />
            </template>
            <template v-else>
              <div class="flex flex-col gap-0.5">
                <span>{{ user.name }}</span>
                <span v-if="user.id === state.user?.id" class="text-[10px] px-1.5 py-0.5 bg-violet-500/20 text-violet-400 border border-violet-500/30 rounded w-fit">ログイン中</span>
              </div>
            </template>
          </td>
          <td class="px-4 py-4 text-zinc-400 whitespace-nowrap">
            <template v-if="editingId === user.id">
              <input v-model="editEmail" class="px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-white text-sm w-48 focus:outline-none focus:border-violet-500" />
            </template>
            <template v-else>{{ user.email }}</template>
          </td>
          <td class="px-4 py-4 text-zinc-400 whitespace-nowrap">{{ user.gender ? GenderLabel[user.gender as keyof typeof GenderLabel] ?? '-' : '-' }}</td>
          <td class="px-4 py-4 whitespace-nowrap">
            <template v-if="editingId === user.id && user.gender === 'male'">
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" v-model="editIsAdmin" class="accent-violet-500" />
                <span class="text-xs text-zinc-300">管理者</span>
              </label>
            </template>
            <template v-else>
              <span :class="[
                'inline-block px-2 py-0.5 rounded-full text-xs font-medium',
                user.isAdmin
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
              ]">
                {{ user.isAdmin ? '管理者' : '一般' }}
              </span>
            </template>
          </td>
          <td class="px-4 py-4 text-zinc-400 whitespace-nowrap">{{ new Date(user.createdAt).toLocaleDateString('ja-JP') }}</td>
          <td class="px-4 py-4 text-right whitespace-nowrap">
            <template v-if="editingId === user.id">
              <button @click="saveEdit(user.id)" class="px-3 py-1 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 border border-violet-500/30 rounded-lg transition-colors mr-1">保存</button>
              <button @click="cancelEdit" class="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 border border-zinc-600 rounded-lg transition-colors">取消</button>
            </template>
            <template v-else>
              <button @click="startEdit(user)" class="px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg transition-colors mr-1">編集</button>
              <button
                v-if="user.id !== state.user?.id"
                @click="deleteUser(user.id)"
                class="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-colors"
              >削除</button>
            </template>
          </td>
        </tr>
        <tr v-if="filteredUsers.length === 0">
          <td colspan="6" class="px-6 py-8 text-center text-zinc-500">ユーザーがいません</td>
        </tr>
      </tbody>
    </table>
    </div>
  </div>
</template>
