<template>
  <div class="space-y-6 max-w-7xl mx-auto pb-12">
    <!-- Header & Filter Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 dark:bg-surface-900/70 backdrop-blur-md p-5 rounded-2xl border border-surface-200/80 dark:border-surface-800 shadow-xs">
      <div>
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <PhShieldCheck :size="20" weight="bold" />
          </div>
          <div>
            <h1 class="text-xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
              Audit Trail & Anti-Fraud Monitor
            </h1>
            <p class="text-xs text-surface-500 dark:text-surface-400">
              Pantau seluruh aktivitas operasional staf, perubahan harga sewa, dan deteksi anomali.
            </p>
          </div>
        </div>
      </div>

      <!-- Action & Filter Controls -->
      <div class="flex items-center gap-3">
        <!-- Actor Filter Dropdown -->
        <div class="relative min-w-[200px]">
          <select
            id="actor-filter-select"
            v-model="actorFilter"
            class="w-full appearance-none rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 py-2 pl-3.5 pr-9 text-xs font-semibold text-surface-800 dark:text-surface-200 shadow-2xs hover:border-surface-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all cursor-pointer"
          >
            <option value="all">Semua Aktivitas</option>
            <option value="role:owner">Hanya Pemilik (Owner)</option>
            <option value="role:operator">Semua Operator Staf</option>
            <optgroup v-if="operators.length > 0" label="Operator Spesifik">
              <option v-for="op in operators" :key="op.id" :value="'user:' + op.id">
                {{ op.name }} (Operator)
              </option>
            </optgroup>
          </select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-surface-400">
            <PhCaretDown :size="14" weight="bold" />
          </div>
        </div>

        <!-- Refresh Button -->
        <button
          @click="fetchLogs"
          :disabled="isLoading"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-surface-700 dark:text-surface-200 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 transition-all active:scale-95 disabled:opacity-60"
        >
          <PhArrowClockwise :size="14" weight="bold" :class="{ 'animate-spin': isLoading }" />
          <span>Refresh</span>
        </button>
      </div>
    </div>

    <!-- Security & Activity Quick Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="p-4 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200/80 dark:border-surface-800 shadow-2xs flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 flex items-center justify-center">
          <PhClockCounterClockwise :size="20" weight="duotone" />
        </div>
        <div>
          <p class="text-xs font-medium text-surface-500 dark:text-surface-400">Total Log Terekam</p>
          <p class="text-lg font-bold text-surface-900 dark:text-surface-50 tabular-nums">{{ totalLogs }}</p>
        </div>
      </div>

      <div class="p-4 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200/80 dark:border-surface-800 shadow-2xs flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center">
          <PhArrowsLeftRight :size="20" weight="duotone" />
        </div>
        <div>
          <p class="text-xs font-medium text-surface-500 dark:text-surface-400">Perubahan Data (Updates)</p>
          <p class="text-lg font-bold text-surface-900 dark:text-surface-50 tabular-nums">{{ updateCount }}</p>
        </div>
      </div>

      <div class="p-4 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200/80 dark:border-surface-800 shadow-2xs flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center">
          <PhShieldWarning :size="20" weight="duotone" />
        </div>
        <div>
          <p class="text-xs font-medium text-surface-500 dark:text-surface-400">Percobaan Akses / Peringatan</p>
          <p class="text-lg font-bold text-surface-900 dark:text-surface-50 tabular-nums">{{ securityAlertCount }}</p>
        </div>
      </div>
    </div>

    <!-- Main Activity Timeline / Card Feed -->
    <div class="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200/80 dark:border-surface-800 shadow-xs overflow-hidden">
      <!-- Loading Skeleton -->
      <div v-if="isLoading" class="divide-y divide-surface-100 dark:divide-surface-800 p-4 space-y-4">
        <div v-for="i in 4" :key="'skel-' + i" class="p-4 rounded-xl bg-surface-50/60 dark:bg-surface-800/40 animate-pulse flex flex-col md:flex-row gap-4">
          <div class="w-10 h-10 rounded-full bg-surface-200 dark:bg-surface-700 flex-shrink-0"></div>
          <div class="flex-1 space-y-2.5">
            <div class="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/3"></div>
            <div class="h-3 bg-surface-200 dark:bg-surface-700 rounded w-2/3"></div>
            <div class="h-10 bg-surface-200 dark:bg-surface-700 rounded w-full"></div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="logs.length === 0" class="py-16 px-4 text-center">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-surface-100 dark:bg-surface-800 text-surface-400 flex items-center justify-center mb-3.5">
          <PhShieldCheck :size="28" weight="duotone" />
        </div>
        <h3 class="text-base font-bold text-surface-900 dark:text-surface-100">Tidak ada aktivitas ditemukan</h3>
        <p class="text-xs text-surface-500 dark:text-surface-400 max-w-sm mx-auto mt-1">
          Belum ada catatan aktivitas staf atau perubahan data untuk filter yang dipilih.
        </p>
      </div>

      <!-- Activity Timeline Cards -->
      <div v-else class="divide-y divide-surface-100 dark:divide-surface-800">
        <div 
          v-for="log in logs" 
          :key="log.id"
          class="p-5 hover:bg-surface-50/60 dark:hover:bg-surface-800/40 transition-colors flex flex-col md:flex-row items-start gap-4"
        >
          <!-- Actor Avatar -->
          <div class="flex items-center gap-3 md:block flex-shrink-0">
            <div 
              class="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shadow-2xs"
              :class="[
                log.actorRole === 'owner' 
                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300' 
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
              ]"
            >
              {{ getInitials(log.actorName) }}
            </div>
            <div class="md:hidden">
              <span class="text-sm font-bold text-surface-900 dark:text-surface-50">{{ log.actorName || 'Staff' }}</span>
              <span class="text-2xs block text-surface-500">{{ formatDate(log.createdAt) }}</span>
            </div>
          </div>

          <!-- Log Content -->
          <div class="flex-1 min-w-0 w-full space-y-2">
            <!-- Header Line: Action, Badge, Timestamp -->
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-bold text-surface-900 dark:text-surface-100 hidden md:inline">
                  {{ log.actorName || 'Staff' }}
                </span>
                
                <!-- Actor Role Badge -->
                <span 
                  class="px-2 py-0.5 rounded-md text-2xs font-semibold uppercase tracking-wider"
                  :class="[
                    log.actorRole === 'owner' 
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-400 border border-brand-200 dark:border-brand-800' 
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  ]"
                >
                  {{ log.actorRole === 'owner' ? 'Owner' : 'Operator' }}
                </span>

                <!-- Action Type Badge -->
                <span 
                  class="px-2 py-0.5 rounded-md text-2xs font-semibold uppercase tracking-wider flex items-center gap-1"
                  :class="getActionBadgeClass(log.action)"
                >
                  <component :is="getActionIcon(log.action)" :size="12" weight="bold" />
                  <span>{{ formatAction(log.action) }}</span>
                </span>
              </div>

              <!-- Timestamp -->
              <span class="text-xs text-surface-500 dark:text-surface-400 tabular-nums hidden md:inline">
                {{ formatDate(log.createdAt) }}
              </span>
            </div>

            <!-- Context / Description -->
            <p class="text-xs text-surface-600 dark:text-surface-300 font-medium">
              {{ formatDetails(log) }}
            </p>

            <!-- Before / After Changes Diff Box -->
            <div 
              v-if="log.details && log.details.changes && Object.keys(log.details.changes).length > 0"
              class="mt-2.5 p-3 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200/70 dark:border-surface-700/60 text-xs space-y-1.5"
            >
              <div class="text-2xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-1">
                Detail Perubahan Nilai:
              </div>
              <div 
                v-for="(change, key) in log.details.changes" 
                :key="key" 
                class="flex flex-wrap items-center gap-2 font-mono text-2xs"
              >
                <span class="font-bold text-surface-700 dark:text-surface-300">{{ formatKey(key) }}:</span>
                <span class="line-through text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded">
                  {{ formatValue(key, change.old) }}
                </span>
                <span class="text-surface-400 font-sans">➔</span>
                <span class="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">
                  {{ formatValue(key, change.new) }}
                </span>
              </div>
            </div>

            <!-- Security Alert Warning Box if Tamper Attempt -->
            <div 
              v-if="log.action === 'TAMPER_ATTEMPT'"
              class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2"
            >
              <PhWarningCircle :size="16" weight="bold" class="flex-shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div>
                <p class="font-bold">Peringatan Keamanan:</p>
                <p class="text-2xs leading-relaxed mt-0.5">
                  {{ log.details?.message || 'Operator mencoba melakukan tindakan tidak sah atau menghapus riwayat audit sistem.' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination Controls -->
      <div 
        v-if="!isLoading && totalPages > 1" 
        class="flex items-center justify-between border-t border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-800/30 px-5 py-3.5"
      >
        <p class="text-xs text-surface-600 dark:text-surface-400">
          Halaman <span class="font-bold text-surface-900 dark:text-surface-100 tabular-nums">{{ page }}</span> dari <span class="font-bold text-surface-900 dark:text-surface-100 tabular-nums">{{ totalPages }}</span>
        </p>
        <div class="flex items-center gap-2">
          <button 
            @click="prevPage" 
            :disabled="page === 1"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
          >
            Sebelumnya
          </button>
          <button 
            @click="nextPage" 
            :disabled="page === totalPages"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
          >
            Selanjutnya
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { 
  PhShieldCheck, 
  PhShieldWarning, 
  PhClockCounterClockwise, 
  PhArrowsLeftRight, 
  PhArrowClockwise, 
  PhCaretDown, 
  PhWarningCircle,
  PhPencilSimple,
  PhPlusCircle,
  PhTrash,
  PhCreditCard,
  PhDoor,
  PhBuildings,
  PhUsersThree
} from '@phosphor-icons/vue'

definePageMeta({
  layout: 'dashboard',
  middleware: ['owner']
})

// State
const logs = ref<any[]>([])
const operators = ref<any[]>([])
const isLoading = ref(true)
const actorFilter = ref('all')
const page = ref(1)
const totalPages = ref(1)
const totalLogs = ref(0)
const { addToast } = useToast()

// Computed Stats
const updateCount = computed(() => {
  return logs.value.filter(l => l.action?.includes('UPDATE') || (l.details?.changes && Object.keys(l.details.changes).length > 0)).length
})

const securityAlertCount = computed(() => {
  return logs.value.filter(l => l.action === 'TAMPER_ATTEMPT' || l.action?.includes('DELETE')).length
})

// Fetch Data
const fetchLogs = async () => {
  isLoading.value = true
  try {
    let role = 'all'
    let actorId = ''
    
    if (actorFilter.value.startsWith('role:')) {
      role = actorFilter.value.split(':')[1] || ''
    } else if (actorFilter.value.startsWith('user:')) {
      actorId = actorFilter.value.split(':')[1] || ''
    }

    const response = await $fetch<any>('/api/audit', {
      params: {
        role,
        actorId,
        page: page.value,
        limit: 15
      }
    })
    logs.value = response.data?.data || response.data || []
    totalPages.value = response.data?.meta?.totalPages || 1
    totalLogs.value = response.data?.meta?.total || logs.value.length
  } catch (error) {
    addToast('Gagal memuat data', 'Terjadi kesalahan saat mengambil log aktivitas audit.', 'error')
  } finally {
    isLoading.value = false
  }
}

const fetchOperators = async () => {
  try {
    const response = await $fetch<any>('/api/audit/operators')
    operators.value = response.data?.data || response.data || []
  } catch (error) {
    addToast('Gagal memuat data', 'Terjadi kesalahan saat mengambil daftar operator.', 'error')
  }
}

// Watchers
watch(actorFilter, () => {
  page.value = 1
  fetchLogs()
})

onMounted(() => {
  fetchOperators()
  fetchLogs()
})

// Pagination Actions
const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
    fetchLogs()
  }
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    fetchLogs()
  }
}

// Formatting Helpers
const getInitials = (name?: string) => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const capitalize = (str: string) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

const formatAction = (action: string) => {
  if (!action) return 'Aktivitas'
  if (action === 'TAMPER_ATTEMPT') return 'Percobaan Pelanggaran'
  if (action === 'CREATE_PROPERTY') return 'Buat Properti'
  if (action === 'ADD_ROOM') return 'Tambah Kamar'
  if (action === 'UPDATE_ROOM') return 'Edit Kamar'
  if (action === 'CHECKIN_TENANT') return 'Check-In Penghuni'
  if (action === 'CHECKOUT_TENANT') return 'Checkout Penghuni'
  if (action === 'GENERATE_INVOICE') return 'Buat Tagihan'
  if (action === 'PAYMENT_RECEIVED') return 'Pembayaran Diterima'
  if (action === 'RECORD_EXPENSE') return 'Catat Pengeluaran'
  if (action === 'UPDATE_EXPENSE') return 'Edit Pengeluaran'
  if (action === 'DELETE_EXPENSE') return 'Hapus Pengeluaran'
  return action.split('_').map(capitalize).join(' ')
}

const getActionIcon = (action: string) => {
  if (action === 'TAMPER_ATTEMPT') return PhShieldWarning
  if (action?.includes('CREATE') || action?.includes('ADD')) return PhPlusCircle
  if (action?.includes('UPDATE') || action?.includes('EDIT')) return PhPencilSimple
  if (action?.includes('DELETE') || action?.includes('CHECKOUT')) return PhTrash
  if (action?.includes('PAYMENT') || action?.includes('INVOICE')) return PhCreditCard
  if (action?.includes('ROOM')) return PhDoor
  if (action?.includes('PROPERTY')) return PhBuildings
  return PhUsersThree
}

const getActionBadgeClass = (action: string) => {
  if (action === 'TAMPER_ATTEMPT' || action?.includes('DELETE')) {
    return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
  }
  if (action?.includes('UPDATE') || action?.includes('EDIT')) {
    return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
  }
  if (action?.includes('CREATE') || action?.includes('ADD') || action?.includes('CHECKIN')) {
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
  }
  if (action?.includes('PAYMENT') || action?.includes('INVOICE')) {
    return 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400 border border-brand-200 dark:border-brand-800'
  }
  return 'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300 border border-surface-200 dark:border-surface-700'
}

const formatKey = (key: string | number) => {
  const k = String(key)
  if (k === 'monthlyRate') return 'Harga Sewa Bulanan'
  if (k === 'roomNumber') return 'Nomor Kamar'
  if (k === 'amount') return 'Nominal Biaya'
  if (k === 'status') return 'Status'
  if (k === 'name') return 'Nama'
  if (k === 'phone') return 'Nomor Telepon'
  return k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
}

const formatValue = (key: string | number, val: any) => {
  if (val === null || val === undefined || val === '') return '(kosong)'
  const k = String(key)
  if (k.toLowerCase().includes('rate') || k.toLowerCase().includes('amount') || k.toLowerCase().includes('price')) {
    const num = Number(val)
    if (!isNaN(num)) {
      return `Rp ${num.toLocaleString('id-ID')}`
    }
  }
  if (typeof val === 'object') {
    return JSON.stringify(val)
  }
  return String(val)
}

const formatDetails = (log: any) => {
  if (!log.details) return 'Aktivitas tercatat oleh sistem.'
  
  if (log.action === 'CREATE_PROPERTY' && log.details.name) {
    return `Membuat properti kos baru: ${log.details.name}`
  }
  if (log.action === 'CHECKIN_TENANT' && log.details.name) {
    return `Mendaftarkan penghuni baru: ${log.details.name}`
  }
  if (log.action === 'ADD_ROOM' && log.details.roomNumber) {
    return `Menambahkan kamar baru: Kamar ${log.details.roomNumber}`
  }
  if (log.action === 'UPDATE_ROOM' && log.details.roomNumber) {
    return `Memperbarui data dan tarif untuk Kamar ${log.details.roomNumber}`
  }
  if (log.action === 'RECORD_EXPENSE') {
    return `Mencatat pengeluaran operasional baru: ${log.details.category || ''}`
  }
  if (log.action === 'TAMPER_ATTEMPT' && log.details.message) {
    return log.details.message
  }
  
  try {
    const keys = Object.keys(log.details).filter(k => k !== 'changes')
    if (keys.length > 0) {
      return keys.map(k => `${formatKey(k)}: ${log.details[k]}`).join(' | ')
    }
  } catch (e) {
    // ignore
  }
  
  return log.details.changes ? 'Memperbarui rincian data pada entitas terkait' : 'Pembaruan data operasional'
}
</script>
