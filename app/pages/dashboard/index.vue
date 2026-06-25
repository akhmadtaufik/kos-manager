<script setup lang="ts">
import { usePropertyState } from '~/composables/usePropertyState'

definePageMeta({
  layout: 'dashboard',
})

const { activePropertyId, activeProperty } = usePropertyState()
const { addToast } = useToast()
const selectedMonth = ref(new Date().toISOString().slice(0, 7)) // YYYY-MM

const rekap = ref({
  totalRooms: 0,
  occupiedRooms: 0,
  revenue: 0,
  expenses: 0,
  netProfit: 0
})
const loadingRekap = ref(false)

const demographics = ref<Array<{ provinceId: string, total: number }>>([])
const loadingDemo = ref(false)

const PROVINCE_MAP: Record<string, string> = {
  '11': 'Aceh', '12': 'Sumatera Utara', '13': 'Sumatera Barat', '14': 'Riau', '15': 'Jambi',
  '16': 'Sumatera Selatan', '17': 'Bengkulu', '18': 'Lampung', '19': 'Kepulauan Bangka Belitung',
  '21': 'Kepulauan Riau', '31': 'DKI Jakarta', '32': 'Jawa Barat', '33': 'Jawa Tengah',
  '34': 'DI Yogyakarta', '35': 'Jawa Timur', '36': 'Banten', '51': 'Bali', '52': 'Nusa Tenggara Barat',
  '53': 'Nusa Tenggara Timur', '61': 'Kalimantan Barat', '62': 'Kalimantan Tengah',
  '63': 'Kalimantan Selatan', '64': 'Kalimantan Timur', '65': 'Kalimantan Utara',
  '71': 'Sulawesi Utara', '72': 'Sulawesi Tengah', '73': 'Sulawesi Selatan', '74': 'Sulawesi Tenggara',
  '75': 'Gorontalo', '76': 'Sulawesi Barat', '81': 'Maluku', '82': 'Maluku Utara',
  '91': 'Papua Barat', '94': 'Papua', 'unknown': 'Tidak Diketahui'
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
}

const fetchRekap = async () => {
  loadingRekap.value = true
  try {
    const query = new URLSearchParams()
    if (activePropertyId.value) query.append('propertyId', activePropertyId.value)
    if (selectedMonth.value) query.append('month', selectedMonth.value)
    
    const res = await $fetch<any>(`/api/reports/rekap?${query.toString()}`)
    if (res.status === 'success') {
      rekap.value = res.data?.data || res.data
    }
  } catch (e) {
    addToast('Gagal memuat data', 'Terjadi kesalahan saat mengambil rekap dashboard.', 'error')
  } finally {
    loadingRekap.value = false
  }
}

const fetchDemographics = async () => {
  loadingDemo.value = true
  try {
    const query = activePropertyId.value ? `?propertyId=${activePropertyId.value}` : ''
    const res = await $fetch<any>(`/api/analytics/demographics${query}`)
    if (res.status === 'success') {
      demographics.value = res.data?.data || res.data || []
    }
  } catch (e) {
    addToast('Gagal memuat data', 'Terjadi kesalahan saat mengambil demografi.', 'error')
  } finally {
    loadingDemo.value = false
  }
}

// Re-fetch when property or month changes
watch([activePropertyId, selectedMonth], () => {
  fetchRekap()
  fetchDemographics()
}, { immediate: true })

</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-slate-900 font-outfit">Dashboard Overview</h1>
      <div class="flex items-center gap-3">
        <label class="text-sm font-medium text-slate-600">Bulan Laporan:</label>
        <input type="month" v-model="selectedMonth" class="px-3 py-2 border rounded-lg border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white">
      </div>
    </div>
    
    <div v-if="!activeProperty" class="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 mb-6 flex items-center gap-3">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
      </svg>
      <div>
        <h2 class="font-bold text-sm">Mode Global View Aktif</h2>
        <p class="text-xs">Menampilkan agregasi P&L dan demografi dari seluruh properti yang Anda miliki.</p>
      </div>
    </div>

    <!-- Summary Cards -->
    <phantom-ui :loading="loadingRekap">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-colors">
          <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h3 class="text-sm font-medium text-slate-500 mb-1 relative z-10">Total Kamar</h3>
          <p class="text-3xl font-bold text-slate-900 relative z-10">
            <span v-if="loadingRekap">00</span>
            <span v-else>{{ rekap.totalRooms }}</span>
          </p>
        </div>
        
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-colors">
          <h3 class="text-sm font-medium text-slate-500 mb-1 relative z-10">Kamar Terisi</h3>
          <p class="text-3xl font-bold text-emerald-600 relative z-10">
            <span v-if="loadingRekap">00 <span class="text-sm text-slate-400 font-normal ml-1">/ 00</span></span>
            <span v-else>{{ rekap.occupiedRooms }} <span class="text-sm text-slate-400 font-normal ml-1">/ {{ rekap.totalRooms }}</span></span>
          </p>
          <!-- Occupancy Bar -->
          <div class="mt-3 w-full bg-slate-100 rounded-full h-1.5 relative z-10">
            <div class="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" :style="{ width: (rekap.totalRooms ? (rekap.occupiedRooms / rekap.totalRooms * 100) : 0) + '%' }"></div>
          </div>
        </div>
        
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-rose-300 transition-colors">
          <h3 class="text-sm font-medium text-slate-500 mb-1 relative z-10">Pengeluaran (Bulan Ini)</h3>
          <p class="text-2xl font-bold text-rose-600 relative z-10">
            <span v-if="loadingRekap">Rp 00.000.000</span>
            <span v-else>{{ formatCurrency(rekap.expenses) }}</span>
          </p>
        </div>
        
        <div class="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 shadow-md relative overflow-hidden group">
          <div class="absolute -right-6 -bottom-6 opacity-20">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-32 w-32 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-sm font-medium text-blue-100 mb-1 relative z-10">Total Pemasukan (Paid)</h3>
          <p class="text-2xl font-bold text-white relative z-10">
            <span v-if="loadingRekap">Rp 00.000.000</span>
            <span v-else>{{ formatCurrency(rekap.revenue) }}</span>
          </p>
        </div>
      </div>
    </phantom-ui>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      <!-- P&L Financial Overview -->
      <phantom-ui :loading="loadingRekap" class="flex flex-col h-full">
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col h-full">
          <h2 class="text-lg font-bold text-slate-900 mb-6 font-outfit">Financial Overview (P&L)</h2>
          
          <div v-if="loadingRekap" class="flex-1 flex flex-col justify-center">
            <!-- Big Net Profit -->
            <div class="text-center mb-8">
              <p class="text-sm text-slate-500 font-medium mb-1">Laba Bersih (Net Profit)</p>
              <h3 class="text-4xl font-bold text-emerald-600">Rp 00.000.000</h3>
            </div>
            
            <!-- Visual Bar -->
            <div class="space-y-4">
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="font-medium text-slate-600">Pemasukan (Revenue)</span>
                  <span class="font-bold text-slate-900">Rp 00.000.000</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-3">
                  <div class="bg-blue-500 h-3 rounded-full transition-all duration-500 w-full"></div>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="font-medium text-slate-600">Pengeluaran (Expenses)</span>
                  <span class="font-bold text-slate-900">Rp 00.000.000</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-3">
                  <div class="bg-rose-500 h-3 rounded-full transition-all duration-500 w-full"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="flex-1 flex flex-col justify-center">
            <!-- Big Net Profit -->
            <div class="text-center mb-8">
              <p class="text-sm text-slate-500 font-medium mb-1">Laba Bersih (Net Profit)</p>
              <h3 class="text-4xl font-bold" :class="rekap.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'">
                {{ formatCurrency(rekap.netProfit) }}
              </h3>
            </div>
            
            <!-- Visual Bar -->
            <div class="space-y-4">
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="font-medium text-slate-600">Pemasukan (Revenue)</span>
                  <span class="font-bold text-slate-900">{{ formatCurrency(rekap.revenue) }}</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-3">
                  <div class="bg-blue-500 h-3 rounded-full transition-all duration-500" :style="{ width: (rekap.revenue >= rekap.expenses || rekap.revenue === 0 ? '100%' : (rekap.revenue / (rekap.expenses || 1) * 100) + '%') }"></div>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="font-medium text-slate-600">Pengeluaran (Expenses)</span>
                  <span class="font-bold text-slate-900">{{ formatCurrency(rekap.expenses) }}</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-3">
                  <div class="bg-rose-500 h-3 rounded-full transition-all duration-500" :style="{ width: (rekap.expenses > rekap.revenue ? '100%' : (rekap.expenses / (rekap.revenue || 1) * 100) + '%') }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </phantom-ui>

      <!-- Demographics -->
      <phantom-ui :loading="loadingDemo" class="flex flex-col h-full">
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col h-full">
          <h2 class="text-lg font-bold text-slate-900 mb-6 font-outfit">Demografi Penyewa (Provinsi)</h2>
          
          <div v-if="loadingDemo" class="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-2">
            <div v-for="i in 4" :key="'skel-demo-'+i" class="relative pt-1">
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="font-medium text-slate-700">Nama Provinsi Panjang</span>
                <span class="font-bold text-slate-900">00 Penyewa</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2">
                <div class="bg-slate-300 h-2 rounded-full transition-all duration-1000 ease-out" style="width: 100%"></div>
              </div>
            </div>
          </div>
          
          <div v-else-if="demographics.length === 0" class="flex-1 flex flex-col items-center justify-center text-slate-400 min-h-[200px]">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p>Belum ada data penyewa aktif.</p>
          </div>
  
          <div v-else class="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-2">
            <!-- Render horizontal bars for each province -->
            <div v-for="(item, index) in demographics" :key="item.provinceId" class="relative pt-1">
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="font-medium text-slate-700">{{ PROVINCE_MAP[item.provinceId] || `ID: ${item.provinceId}` }}</span>
                <span class="font-bold text-slate-900">{{ item.total }} Penyewa</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2">
                <div 
                  class="h-2 rounded-full transition-all duration-1000 ease-out" 
                  :class="index === 0 ? 'bg-blue-600' : (index === 1 ? 'bg-blue-400' : 'bg-slate-300')"
                  :style="{ width: (item.total / demographics[0].total * 100) + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </phantom-ui>
      
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar for demographics container */
.max-h-\[300px\]::-webkit-scrollbar {
  width: 4px;
}
.max-h-\[300px\]::-webkit-scrollbar-track {
  background: transparent;
}
.max-h-\[300px\]::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}
</style>
