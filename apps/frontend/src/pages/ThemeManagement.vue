<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { API, useApi } from '../composables/useApi'
import ThemeForm from '../components/theme/ThemeForm.vue'
import ThemeTable from '../components/theme/ThemeTable.vue'

const { authHeaders: auth } = useApi()

const themes = ref<any[]>([])
const loading = ref(false)
const editingTheme = ref<any | null>(null)

async function fetchThemes() {
  loading.value = true
  try {
    const res = await fetch(`${API}/api/themes`, { headers: auth() })
    themes.value = await res.json()
  } finally {
    loading.value = false
  }
}

function handleSaved() {
  editingTheme.value = null
  fetchThemes()
}

onMounted(fetchThemes)
</script>

<template>
  <div class="flex flex-col gap-6">
    <ThemeForm
      :editing-theme="editingTheme"
      @saved="handleSaved"
      @cancelled="editingTheme = null"
    />
    <ThemeTable
      :themes="themes"
      :loading="loading"
      @edit="editingTheme = $event"
      @deleted="fetchThemes"
    />
  </div>
</template>
