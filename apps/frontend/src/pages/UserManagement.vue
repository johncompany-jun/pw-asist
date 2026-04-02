<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { API, useApi } from '../composables/useApi'
import UserForm from '../components/user/UserForm.vue'
import UserCsvUpload from '../components/user/UserCsvUpload.vue'
import UserTable from '../components/user/UserTable.vue'

const { authHeaders: auth } = useApi()

const users = ref<any[]>([])
const loading = ref(false)
const error = ref('')

async function fetchUsers() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(`${API}/api/users`, { headers: auth() })
    if (!res.ok) throw new Error('ユーザー情報の取得に失敗しました')
    users.value = await res.json()
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(fetchUsers)
</script>

<template>
  <div class="flex flex-col gap-6">
    <UserForm @created="fetchUsers" />
    <UserCsvUpload @created="fetchUsers" />
    <UserTable :users="users" :loading="loading" :error="error" @deleted="fetchUsers" @updated="fetchUsers" />
  </div>
</template>
