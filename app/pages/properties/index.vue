<script setup lang="ts">
import { usePropertyState } from '~/composables/usePropertyState'
import { useAuth } from '#imports'

definePageMeta({
  layout: 'dashboard',
  middleware: ['owner']
})

const { properties, loadProperties, isLoading } = usePropertyState()
const { data } = useAuth()
const isSuperadmin = computed(() => (data.value?.user as any)?.role === 'superadmin')
const isOwner = computed(() => (data.value?.user as any)?.role === 'owner')
const canManage = computed(() => isSuperadmin.value || isOwner.value)

const isCreating = ref(false)
const editingId = ref<string | null>(null)
const formData = reactive({
  name: '',
  address: ''
})

const startEdit = (prop: any) => {
  editingId.value = prop.id
  formData.name = prop.name
  formData.address = prop.address || ''
}

const cancelEdit = () => {
  editingId.value = null
  formData.name = ''
  formData.address = ''
}

const submitProperty = async () => {
  if (!formData.name) return
  isCreating.value = true
  
  try {
    if (editingId.value) {
      await $fetch(`/api/properties/${editingId.value}`, {
        method: 'PATCH',
        body: formData
      })
      alert('Property updated successfully!')
    } else {
      await $fetch('/api/properties', {
        method: 'POST',
        body: formData
      })
      alert('Property created successfully!')
    }
    
    cancelEdit()
    await loadProperties(true)
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Failed to save property')
  } finally {
    isCreating.value = false
  }
}

const deleteProperty = async (id: string) => {
  if (!confirm('Hapus properti ini? Data tidak dapat dikembalikan.')) return
  try {
    await $fetch(`/api/properties/${id}`, {
      method: 'DELETE'
    })
    await loadProperties(true)
    alert('Property deleted successfully!')
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Failed to delete property')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-slate-900 font-outfit">Properties Management</h1>
    </div>
    
    <div v-if="canManage" class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
      <h2 class="text-lg font-bold mb-4 font-outfit">{{ editingId ? 'Edit Property' : 'Add New Property' }}</h2>
      <form @submit.prevent="submitProperty" class="flex items-end gap-4">
        <div class="flex-1">
          <label class="block text-sm font-medium text-slate-700 mb-1">Property Name</label>
          <input v-model="formData.name" type="text" required class="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-colors" placeholder="e.g., Kos Eksekutif Sudirman" />
        </div>
        <div class="flex-1">
          <label class="block text-sm font-medium text-slate-700 mb-1">Address (Optional)</label>
          <input v-model="formData.address" type="text" class="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-colors" placeholder="e.g., Jl. Jendral Sudirman No.1" />
        </div>
        <button v-if="editingId" type="button" @click="cancelEdit" class="text-slate-600 hover:bg-slate-100 font-medium rounded-lg px-5 py-2.5 transition-colors">
          Cancel
        </button>
        <button type="submit" :disabled="isCreating" class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg px-5 py-2.5 transition-colors">
          {{ isCreating ? 'Saving...' : (editingId ? 'Update' : 'Create') }}
        </button>
      </form>
    </div>
    
    <phantom-ui :loading="isLoading">
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table class="w-full text-sm text-left text-slate-500">
          <thead class="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th scope="col" class="px-6 py-3">Property Name</th>
              <th scope="col" class="px-6 py-3">Address</th>
              <th scope="col" class="px-6 py-3">Created</th>
              <th scope="col" class="px-6 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="isLoading">
              <tr v-for="i in 3" :key="'skel-'+i" class="bg-white border-b border-slate-100">
                <td class="px-6 py-4 font-medium text-slate-900">Mock Property Name</td>
                <td class="px-6 py-4">Jl. Mock Address No. 123</td>
                <td class="px-6 py-4">01/01/2026</td>
                <td class="px-6 py-4"><span class="text-blue-600 font-medium">Edit</span></td>
              </tr>
            </template>
            <tr v-else-if="properties.length === 0">
              <td colspan="4" class="px-6 py-8 text-center text-slate-500">
                No properties found.
              </td>
            </tr>
            <template v-else>
              <tr v-for="prop in properties" :key="prop.id" class="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4 font-medium text-slate-900">{{ prop.name }}</td>
                <td class="px-6 py-4">{{ prop.address || '-' }}</td>
                <td class="px-6 py-4">{{ new Date(prop.createdAt).toLocaleDateString() }}</td>
                <td class="px-6 py-4">
                  <div v-if="canManage" class="flex gap-3">
                    <button @click="startEdit(prop)" class="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                    <button @click="deleteProperty(prop.id)" class="text-rose-600 hover:text-rose-800 font-medium">Hapus</button>
                  </div>
                  <span v-else class="text-slate-400">-</span>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </phantom-ui>
  </div>
</template>
