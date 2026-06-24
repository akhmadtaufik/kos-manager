<template>
  <div v-if="!activeProperty" class="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 mb-8 flex items-center gap-3">
    <div class="flex-1">
      <h2 class="font-bold text-sm">Mode Global View Aktif</h2>
      <p class="text-xs">Menampilkan seluruh pengeluaran dari semua properti. Pilih properti spesifik di menu atas untuk mencatat pengeluaran baru.</p>
    </div>
  </div>

  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-slate-900">Pengeluaran Operasional</h1>
      <button v-if="activeProperty" @click="showForm = true" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
        Catat Pengeluaran
      </button>
    </div>

    <!-- Form Modal -->
    <div v-if="showForm" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div class="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 class="text-lg font-bold text-slate-900">Catat Pengeluaran Baru</h2>
          <button @click="showForm = false" class="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form @submit.prevent="submitForm" class="p-6 space-y-4">
          <div v-if="error" class="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {{ error }}
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
            <input type="date" v-model="form.date" required class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
            <select v-model="form.category" required class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="Listrik">Listrik</option>
              <option value="Air">Air</option>
              <option value="Internet">Internet / WiFi</option>
              <option value="Kebersihan">Kebersihan</option>
              <option value="Perbaikan">Perbaikan & Pemeliharaan</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Nominal (Rp)</label>
            <input type="number" v-model="form.amount" required min="0" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
            <textarea v-model="form.description" rows="3" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
          </div>
          
          <div class="pt-4 flex justify-end gap-3">
            <button type="button" @click="showForm = false" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Batal</button>
            <button type="submit" :disabled="loading" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
              {{ loading ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <phantom-ui :loading="pending">
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200">
              <th v-if="!activeProperty" class="p-4 font-medium text-slate-600">Properti</th>
              <th class="p-4 font-medium text-slate-600">Tanggal</th>
              <th class="p-4 font-medium text-slate-600">Kategori</th>
              <th class="p-4 font-medium text-slate-600">Deskripsi</th>
              <th class="p-4 font-medium text-slate-600">Nominal</th>
              <th class="p-4 font-medium text-slate-600">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="pending">
              <tr v-for="i in 5" :key="'skel-'+i" class="border-b border-slate-100 hover:bg-slate-50">
                <td v-if="!activeProperty" class="p-4 text-slate-700 font-medium">Mock Property</td>
                <td class="p-4 text-slate-600">01/01/2026</td>
                <td class="p-4"><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Listrik</span></td>
                <td class="p-4 text-slate-600">Pembayaran Listrik Bulanan</td>
                <td class="p-4 font-medium text-rose-600">Rp 500.000</td>
                <td class="p-4"><span class="text-rose-600 text-xs font-medium">Hapus</span></td>
              </tr>
            </template>
            <tr v-else-if="!expenses?.data?.length" class="border-b border-slate-100">
              <td colspan="6" class="p-4 text-center text-slate-500">Belum ada catatan pengeluaran.</td>
            </tr>
            <template v-else>
              <tr v-for="exp in expenses.data" :key="exp.id" class="border-b border-slate-100 hover:bg-slate-50">
                <td v-if="!activeProperty" class="p-4 text-slate-700 font-medium">{{ exp.property?.name || '-' }}</td>
                <td class="p-4 text-slate-600">{{ new Date(exp.date).toLocaleDateString('id-ID') }}</td>
                <td class="p-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                    {{ exp.category }}
                  </span>
                </td>
                <td class="p-4 text-slate-600">{{ exp.description || '-' }}</td>
                <td class="p-4 font-medium text-rose-600">Rp {{ Number(exp.amount).toLocaleString('id-ID') }}</td>
                <td class="p-4">
                  <button @click="deleteExpense(exp.id)" class="text-rose-600 hover:text-rose-800 font-medium text-xs">Hapus</button>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </phantom-ui>
  </div>
</template>

<script setup lang="ts">
import { usePropertyState } from '~/composables/usePropertyState'

definePageMeta({
  layout: 'dashboard',
})

const { activePropertyId, activeProperty } = usePropertyState()
const showForm = ref(false)
const loading = ref(false)
const error = ref('')

const form = ref({
  date: new Date().toISOString().split('T')[0],
  category: 'Listrik',
  amount: '',
  description: ''
})

const expenses = ref<{ data: any[] }>({ data: [] })
const pending = ref(false)

const fetchExpenses = async () => {
  pending.value = true
  try {
    const query = activePropertyId.value ? `?propertyId=${activePropertyId.value}` : ''
    const res = await $fetch<any>(`/api/expenses${query}`)
    if (res.status === 'success') {
      expenses.value.data = res.data?.data || res.data || []
    }
  } catch (err) {
    console.error('Failed to fetch expenses', err)
  } finally {
    pending.value = false
  }
}

watch(activePropertyId, () => {
  fetchExpenses()
}, { immediate: true })

async function submitForm() {
  if (!activeProperty.value) return
  try {
    loading.value = true
    error.value = ''

    await $fetch('/api/expenses', {
      method: 'POST',
      body: {
        propertyId: activeProperty.value.id,
        ...form.value
      }
    })

    showForm.value = false
    form.value = {
      date: new Date().toISOString().split('T')[0],
      category: 'Listrik',
      amount: '',
      description: ''
    }
    await fetchExpenses()
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'Gagal menyimpan pengeluaran.'
  } finally {
    loading.value = false
  }
}

async function deleteExpense(id: string) {
  if (!confirm('Hapus data pengeluaran ini secara permanen?')) return
  try {
    error.value = ''
    await $fetch(`/api/expenses/${id}`, {
      method: 'DELETE'
    })
    await fetchExpenses()
  } catch (e: any) {
    alert(e.data?.statusMessage || 'Gagal menghapus pengeluaran.')
  }
}
</script>
