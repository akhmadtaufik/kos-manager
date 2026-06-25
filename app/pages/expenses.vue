<template>
  <div v-if="!activeProperty" class="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 mb-8 flex items-center gap-3">
    <div class="flex-1">
      <h2 class="font-bold text-sm">Mode Global View Aktif</h2>
      <p class="text-xs">Menampilkan seluruh pengeluaran dari semua properti. Pilih properti spesifik di menu atas untuk mencatat pengeluaran baru.</p>
    </div>
  </div>

  <div>
    <!-- Header & Quick Stats -->
    <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Pengeluaran Operasional</h1>
        <p class="text-sm text-slate-500 mt-1">Kelola dan pantau seluruh pengeluaran properti Anda.</p>
      </div>
      
      <div class="flex items-center gap-4">
        <!-- Quick Stats -->
        <div class="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Bulan Ini</span>
          <span class="text-lg font-bold text-rose-600">Rp {{ totalExpenses.toLocaleString('id-ID') }}</span>
        </div>
        
        <button v-if="activeProperty" @click="showForm = true" class="bg-slate-900 text-white px-5 py-3.5 rounded-xl font-medium hover:bg-slate-800 transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          Catat Pengeluaran
        </button>
      </div>
    </div>

    <!-- Form Modal -->
    <Transition name="modal">
      <!-- Overlay Backdrop -->
      <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm">
        
        <!-- Modal Card -->
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden transform transition-all">
          
          <!-- 1. STICKY HEADER -->
          <div class="flex-shrink-0 px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
            <h3 class="text-lg font-bold text-slate-900">Catat Pengeluaran Baru</h3>
            <button @click="showForm = false" class="text-slate-400 hover:text-slate-600 transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form @submit.prevent="submitForm" class="flex flex-col min-h-0 flex-1">
            <!-- 2. SCROLLABLE BODY -->
            <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1.5">Tanggal</label>
                <input type="date" v-model="form.date" required class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all">
              </div>

              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">Kategori Pengeluaran</label>
                <div class="grid grid-cols-3 gap-3 mb-3">
                  <button 
                    v-for="cat in predefinedCategories" 
                    :key="cat.name"
                    type="button"
                    @click="selectCategory(cat.name)"
                    class="flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all"
                    :class="[
                      formCategoryMode === 'predefined' && form.category === cat.name 
                        ? 'border-slate-900 bg-slate-900 text-white shadow-md' 
                        : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                    ]"
                  >
                    <component :is="cat.icon" class="w-6 h-6 mb-1.5" />
                    <span class="text-xs font-medium">{{ cat.label }}</span>
                  </button>
                  
                  <!-- Custom Option -->
                  <button 
                    type="button"
                    @click="selectCustomCategory"
                    class="flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all"
                    :class="[
                      formCategoryMode === 'custom'
                        ? 'border-slate-900 bg-slate-900 text-white shadow-md' 
                        : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                    ]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span class="text-xs font-medium">Lainnya</span>
                  </button>
                </div>
                
                <!-- Custom Category Input -->
                <div v-if="formCategoryMode === 'custom'" class="animate-in fade-in slide-in-from-top-2 duration-200">
                  <input 
                    type="text" 
                    v-model="customCategoryName" 
                    placeholder="Ketik nama kategori..." 
                    required
                    class="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-slate-900 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1.5">Nominal (Rp)</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span class="text-slate-500 font-medium">Rp</span>
                  </div>
                  <input type="number" v-model="form.amount" required min="0" class="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all">
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1.5">Deskripsi</label>
                <textarea v-model="form.description" rows="2" placeholder="Catatan tambahan (opsional)" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all resize-none"></textarea>
              </div>
            </div>

            <!-- 3. STICKY FOOTER -->
            <div class="flex-shrink-0 px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button type="button" @click="showForm = false" class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                Batal
              </button>
              <button type="submit" :disabled="loading" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
                <span v-if="loading" class="flex items-center gap-2">
                  <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Menyimpan...
                </span>
                <span v-else>Simpan</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <phantom-ui :loading="pending">
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/80">
                <th v-if="!activeProperty" class="p-4 pl-6 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Properti</th>
                <th class="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap" :class="{'pl-6': activeProperty}">Tanggal</th>
                <th class="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Kategori</th>
                <th class="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Deskripsi</th>
                <th class="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap text-right">Nominal</th>
                <th class="p-4 pr-6 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <template v-if="pending">
                <tr v-for="i in 5" :key="'skel-'+i" class="animate-pulse">
                  <td v-if="!activeProperty" class="p-4 pl-6"><div class="h-4 bg-slate-200 rounded w-24"></div></td>
                  <td class="p-4" :class="{'pl-6': activeProperty}"><div class="h-4 bg-slate-200 rounded w-20"></div></td>
                  <td class="p-4">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-lg bg-slate-200 flex-shrink-0"></div>
                      <div class="h-4 bg-slate-200 rounded w-20"></div>
                    </div>
                  </td>
                  <td class="p-4"><div class="h-4 bg-slate-200 rounded w-48"></div></td>
                  <td class="p-4 text-right"><div class="h-4 bg-slate-200 rounded w-24 ml-auto"></div></td>
                  <td class="p-4 pr-6 text-right"><div class="h-4 bg-slate-200 rounded w-8 ml-auto"></div></td>
                </tr>
              </template>
              <tr v-else-if="!expenses?.data?.length">
                <td colspan="6" class="p-12 text-center">
                  <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 class="text-slate-900 font-medium mb-1">Belum ada pengeluaran</h3>
                  <p class="text-slate-500 text-sm">Mulai catat pengeluaran operasional Anda.</p>
                </td>
              </tr>
              <template v-else>
                <tr v-for="exp in expenses.data" :key="exp.id" class="group hover:bg-slate-50/80 transition-colors">
                  <td v-if="!activeProperty" class="p-4 pl-6 text-sm font-medium text-slate-900 whitespace-nowrap">{{ exp.property?.name || '-' }}</td>
                  <td class="p-4 text-sm text-slate-600 whitespace-nowrap" :class="{'pl-6': activeProperty}">{{ new Date(exp.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) }}</td>
                  <td class="p-4">
                    <div class="flex items-center gap-3">
                      <div :class="getCategoryColor(exp.category).bg" class="p-2 rounded-lg text-white flex-shrink-0 shadow-sm">
                        <component :is="getCategoryIcon(exp.category)" class="w-4 h-4" />
                      </div>
                      <span class="font-medium text-sm text-slate-900">{{ exp.category }}</span>
                    </div>
                  </td>
                  <td class="p-4 text-sm text-slate-600 max-w-xs truncate">{{ exp.description || '-' }}</td>
                  <td class="p-4 text-right whitespace-nowrap">
                    <span class="font-bold text-sm text-slate-900">Rp {{ Number(exp.amount).toLocaleString('id-ID') }}</span>
                  </td>
                  <td class="p-4 pr-6 text-right whitespace-nowrap">
                    <button @click="deleteExpense(exp.id)" class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Hapus Pengeluaran">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </phantom-ui>
  </div>
</template>

<script setup lang="ts">
import { usePropertyState } from '~/composables/usePropertyState'
import { useToast } from '~/composables/useToast'
import { h, computed, watch, ref } from 'vue'

definePageMeta({
  layout: 'dashboard',
})

const { activePropertyId, activeProperty } = usePropertyState()
const { addToast } = useToast()

const showForm = ref(false)
const loading = ref(false)

const formCategoryMode = ref<'predefined' | 'custom'>('predefined')
const customCategoryName = ref('')

const form = ref({
  date: new Date().toISOString().split('T')[0],
  category: 'Listrik',
  amount: '',
  description: ''
})

const expenses = ref<{ data: any[] }>({ data: [] })
const pending = ref(false)

const totalExpenses = computed(() => {
  return expenses.value.data.reduce((sum, exp) => sum + Number(exp.amount), 0)
})

// Icons as render functions for predefined categories
const IconLightning = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", 'stroke-width': "2" }, [
  h('path', { 'stroke-linecap': "round", 'stroke-linejoin': "round", d: "M13 10V3L4 14h7v7l9-11h-7z" })
])

const IconDroplet = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", 'stroke-width': "2" }, [
  h('path', { 'stroke-linecap': "round", 'stroke-linejoin': "round", d: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" })
])

const IconWifi = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", 'stroke-width': "2" }, [
  h('path', { 'stroke-linecap': "round", 'stroke-linejoin': "round", d: "M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" })
])

const IconBroom = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", 'stroke-width': "2" }, [
  h('path', { 'stroke-linecap': "round", 'stroke-linejoin': "round", d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" })
]) 

const IconWrench = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", 'stroke-width': "2" }, [
  h('path', { 'stroke-linecap': "round", 'stroke-linejoin': "round", d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" }),
  h('path', { 'stroke-linecap': "round", 'stroke-linejoin': "round", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" })
]) 

const IconTag = () => h('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", 'stroke-width': "2" }, [
  h('path', { 'stroke-linecap': "round", 'stroke-linejoin': "round", d: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" })
])

const predefinedCategories = [
  { name: 'Listrik', label: 'Listrik', icon: IconLightning, color: 'bg-amber-500' },
  { name: 'Air', label: 'Air', icon: IconDroplet, color: 'bg-blue-500' },
  { name: 'Internet', label: 'Internet', icon: IconWifi, color: 'bg-indigo-500' },
  { name: 'Kebersihan', label: 'Kebersihan', icon: IconBroom, color: 'bg-emerald-500' },
  { name: 'Perbaikan', label: 'Perbaikan', icon: IconWrench, color: 'bg-rose-500' },
]

function selectCategory(name: string) {
  formCategoryMode.value = 'predefined'
  form.value.category = name
}

function selectCustomCategory() {
  formCategoryMode.value = 'custom'
  form.value.category = '' 
}

const getCategoryConfig = (categoryName: string) => {
  const found = predefinedCategories.find(c => c.name === categoryName)
  if (found) {
    return { icon: found.icon, bg: found.color }
  }
  return { icon: IconTag, bg: 'bg-slate-700' }
}

const getCategoryIcon = (categoryName: string) => getCategoryConfig(categoryName).icon
const getCategoryColor = (categoryName: string) => getCategoryConfig(categoryName)

const fetchExpenses = async () => {
  pending.value = true
  try {
    const query = activePropertyId.value ? `?propertyId=${activePropertyId.value}` : ''
    const res = await $fetch<any>(`/api/expenses${query}`)
    if (res.status === 'success') {
      expenses.value.data = res.data?.data || res.data || []
    }
  } catch (err) {
    addToast('Gagal', 'Terjadi kesalahan saat mengambil data pengeluaran.', 'error')
  } finally {
    pending.value = false
  }
}

watch(activePropertyId, () => {
  fetchExpenses()
}, { immediate: true })

async function submitForm() {
  if (!activeProperty.value) return
  
  const finalCategory = formCategoryMode.value === 'custom' ? customCategoryName.value : form.value.category
  
  if (!finalCategory) {
    addToast('Kategori Kosong', 'Silakan pilih atau ketik kategori pengeluaran.', 'error')
    return
  }

  try {
    loading.value = true

    await $fetch('/api/expenses', {
      method: 'POST',
      body: {
        propertyId: activeProperty.value.id,
        date: form.value.date,
        category: finalCategory,
        amount: form.value.amount,
        description: form.value.description
      }
    })

    showForm.value = false
    
    // Reset Form
    form.value = {
      date: new Date().toISOString().split('T')[0],
      category: 'Listrik',
      amount: '',
      description: ''
    }
    formCategoryMode.value = 'predefined'
    customCategoryName.value = ''
    
    addToast('Berhasil', 'Pengeluaran baru telah dicatat.', 'success')
    await fetchExpenses()
  } catch (e: any) {
    addToast('Gagal', e.data?.statusMessage || 'Gagal menyimpan pengeluaran.', 'error')
  } finally {
    loading.value = false
  }
}

async function deleteExpense(id: string) {
  if (!confirm('Hapus data pengeluaran ini secara permanen?')) return
  try {
    await $fetch(`/api/expenses/${id}`, {
      method: 'DELETE'
    })
    addToast('Dihapus', 'Data pengeluaran berhasil dihapus.', 'success')
    await fetchExpenses()
  } catch (e: any) {
    addToast('Gagal', e.data?.statusMessage || 'Gagal menghapus pengeluaran.', 'error')
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .transform,
.modal-leave-active .transform {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.modal-enter-from .transform,
.modal-leave-to .transform {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>
