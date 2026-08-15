<script setup lang="ts">
import { usePropertyState } from '~/composables/usePropertyState'
import { useAuth } from '#imports'
import { PhBuildings, PhPencilSimple, PhTrash } from '@phosphor-icons/vue'

definePageMeta({
  layout: 'dashboard',
  middleware: ['owner']
})

const { properties, loadProperties, isLoading } = usePropertyState()
const { data } = useAuth()
const { addToast } = useToast()
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

const focusInput = () => {
  if (typeof document !== 'undefined') {
    (document.querySelector('input') as HTMLElement)?.focus()
  }
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
      addToast('Berhasil', 'Properti berhasil diperbarui!', 'success')
    } else {
      await $fetch('/api/properties', {
        method: 'POST',
        body: formData
      })
      addToast('Berhasil', 'Properti berhasil ditambahkan!', 'success')
    }
    
    cancelEdit()
    await loadProperties(true)
  } catch (err: any) {
    addToast('Gagal', err.data?.statusMessage || 'Gagal menyimpan properti.', 'error')
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
    addToast('Berhasil', 'Properti berhasil dihapus!', 'success')
  } catch (err: any) {
    addToast('Gagal', err.data?.statusMessage || 'Gagal menghapus properti.', 'error')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4 md:mb-6">
      <h1 class="text-xl md:text-2xl font-bold text-slate-900 font-outfit">Properties Management</h1>
    </div>
    
    <div v-if="canManage" class="bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-sm mb-6 md:mb-8">
      <h2 class="text-lg font-bold mb-4 font-outfit">{{ editingId ? 'Edit Property' : 'Add New Property' }}</h2>
      <form @submit.prevent="submitProperty" class="flex flex-col md:flex-row items-stretch md:items-end gap-4">
        <div class="flex-1">
          <label class="block text-sm font-medium text-slate-700 mb-1">Property Name</label>
          <input v-model="formData.name" type="text" required class="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-colors min-h-[44px]" placeholder="e.g., Kos Eksekutif Sudirman" />
        </div>
        <div class="flex-1">
          <label class="block text-sm font-medium text-slate-700 mb-1">Address (Optional)</label>
          <input v-model="formData.address" type="text" class="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-colors min-h-[44px]" placeholder="e.g., Jl. Jendral Sudirman No.1" />
        </div>
        <div class="flex flex-col sm:flex-row gap-3 md:gap-4 w-full md:w-auto mt-2 md:mt-0">
          <button v-if="editingId" type="button" @click="cancelEdit" class="flex-1 md:flex-none text-surface-600 hover:bg-surface-100 font-medium rounded-lg px-5 py-2.5 transition-colors active:scale-[0.98] min-h-[44px]">
            Cancel
          </button>
          <button type="submit" :disabled="isCreating" class="flex-1 md:flex-none bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium rounded-lg px-5 py-2.5 transition-all duration-200 active:scale-[0.98] shadow-subtle min-h-[44px]">
            {{ isCreating ? 'Saving...' : (editingId ? 'Update' : 'Create') }}
          </button>
        </div>
      </form>
    </div>
    
    <phantom-ui :loading="isLoading">
      <!-- Desktop Table View -->
      <div v-if="isLoading || properties.length > 0" class="hidden md:block bg-white rounded-[1.5rem] border border-surface-200 shadow-sm overflow-hidden">
        <table class="w-full text-sm text-left text-surface-500">
          <thead class="text-[11px] text-surface-500 font-mono tracking-wider uppercase bg-surface-50 border-b border-surface-200">
            <tr>
              <th scope="col" class="px-8 py-5 font-medium">Property Name</th>
              <th scope="col" class="px-8 py-5 font-medium">Address</th>
              <th scope="col" class="px-8 py-5 font-medium">Created</th>
              <th scope="col" class="px-8 py-5 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="isLoading">
              <tr v-for="i in 3" :key="'skel-'+i" class="bg-white border-b border-surface-100">
                <td class="px-8 py-6"><div class="skeleton h-4 w-3/4 rounded"></div></td>
                <td class="px-8 py-6"><div class="skeleton h-4 w-1/2 rounded"></div></td>
                <td class="px-8 py-6"><div class="skeleton h-4 w-1/3 rounded"></div></td>
                <td class="px-8 py-6"><div class="skeleton h-8 w-16 rounded-md"></div></td>
              </tr>
            </template>
            <template v-else>
              <tr v-for="prop in properties" :key="prop.id" class="bg-white border-b border-surface-100 hover:bg-surface-50 transition-colors">
                <td class="px-8 py-6 font-medium text-surface-900">{{ prop.name }}</td>
                <td class="px-8 py-6 text-surface-600">{{ prop.address || '-' }}</td>
                <td class="px-8 py-6 text-surface-600 tabular-nums">{{ new Date(prop.createdAt).toLocaleDateString() }}</td>
                <td class="px-8 py-6">
                  <div v-if="canManage" class="flex gap-2 items-center">
                    <button @click="startEdit(prop)" class="p-2 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-surface-100 transition-all duration-200 group min-h-[44px] min-w-[44px] flex items-center justify-center" title="Edit">
                      <PhPencilSimple :size="18" weight="duotone" class="group-hover:scale-110 transition-transform" />
                    </button>
                    <button @click="deleteProperty(prop.id)" class="p-2 rounded-lg text-surface-400 hover:text-danger-600 hover:bg-danger-50 transition-all duration-200 group min-h-[44px] min-w-[44px] flex items-center justify-center" title="Hapus">
                      <PhTrash :size="18" weight="duotone" class="group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                  <span v-else class="text-slate-400 min-h-[44px] flex items-center">-</span>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Mobile Stacked Cards View -->
      <div v-if="isLoading || properties.length > 0" class="md:hidden flex flex-col gap-4">
        <template v-if="isLoading">
          <div v-for="i in 3" :key="'skel-mob-'+i" class="bg-white p-5 rounded-[1.25rem] border border-surface-200 shadow-sm">
            <div class="skeleton h-5 w-2/3 rounded mb-2"></div>
            <div class="skeleton h-4 w-1/2 rounded mb-4"></div>
            <div class="border-t border-surface-100 pt-4 flex justify-between items-center">
              <div class="skeleton h-4 w-1/3 rounded"></div>
              <div class="skeleton h-10 w-20 rounded-xl"></div>
            </div>
          </div>
        </template>
        <template v-else>
          <div v-for="prop in properties" :key="'mob-'+prop.id" class="bg-white p-5 rounded-[1.25rem] border border-surface-200 shadow-sm relative overflow-hidden group">
            <div class="mb-4">
              <h3 class="font-bold text-surface-900 text-lg mb-1">{{ prop.name }}</h3>
              <p class="text-sm text-surface-600 flex items-start gap-1.5">
                <span class="mt-0.5 text-surface-400"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></span>
                {{ prop.address || '-' }}
              </p>
            </div>
            
            <div class="flex items-center justify-between mt-4 pt-4 border-t border-surface-100">
              <div class="flex flex-col">
                <span class="text-[10px] text-surface-400 font-medium uppercase tracking-wider">Created</span>
                <span class="text-sm text-surface-700 font-medium">{{ new Date(prop.createdAt).toLocaleDateString() }}</span>
              </div>
              
              <div v-if="canManage" class="flex gap-2">
                <button @click="startEdit(prop)" class="min-w-[44px] min-h-[44px] flex items-center justify-center bg-surface-50 text-surface-600 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors">
                  <PhPencilSimple :size="20" weight="duotone" />
                </button>
                <button @click="deleteProperty(prop.id)" class="min-w-[44px] min-h-[44px] flex items-center justify-center bg-surface-50 text-surface-600 hover:text-danger-600 hover:bg-danger-50 rounded-xl transition-colors">
                  <PhTrash :size="20" weight="duotone" />
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
      
      <!-- Premium Empty State -->
      <div v-else class="bg-white rounded-[1.5rem] border border-surface-200 shadow-sm overflow-hidden p-16 relative flex flex-col items-center justify-center text-center">
        <!-- Grid Background Pattern -->
        <div class="absolute inset-0 pointer-events-none opacity-[0.03]" style="background-image: radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0); background-size: 24px 24px;"></div>
        
        <div class="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-5 relative z-10 ring-8 ring-brand-50/50">
          <PhBuildings :size="32" weight="duotone" class="text-brand-600" />
        </div>
        <h3 class="text-xl font-bold text-surface-900 mb-2 relative z-10 font-outfit">No Properties Yet</h3>
        <p class="text-[15px] text-surface-500 max-w-sm mb-8 relative z-10 leading-relaxed">You haven't added any properties to your portfolio. Get started by creating your first property to manage rooms and tenants.</p>
        <button v-if="canManage" @click="focusInput" class="bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl px-6 py-3 transition-all duration-300 active:scale-[0.98] shadow-subtle relative z-10">
          Add New Property
        </button>
      </div>
    </phantom-ui>
  </div>
</template>
