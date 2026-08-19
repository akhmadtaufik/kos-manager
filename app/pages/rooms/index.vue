<template>
  <div class="space-y-6">
    <!-- Page Header & Action -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50 font-outfit tracking-tight">
          Manajemen Kamar
        </h1>
        <p class="text-xs text-surface-500 dark:text-surface-400 mt-1">
          Kelola unit kamar, pantau status okupansi, atur tarif sewa pokok, dan fasilitas berkala.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Add Room Primary Button -->
        <button 
          @click="openAddSlideOver"
          id="btn-add-room"
          type="button"
          :disabled="!activePropertyId"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-all shadow-sm active:scale-95 whitespace-nowrap min-h-[42px]"
        >
          <PhPlus :size="16" weight="bold" />
          <span>Tambah Kamar</span>
        </button>
      </div>
    </div>

    <!-- Mode Global View Alert when no property selected -->
    <div v-if="!activePropertyId" class="bg-blue-50/70 text-blue-800 p-4 rounded-2xl border border-blue-200/60 flex items-center gap-3">
      <div class="flex-1 text-xs">
        <h2 class="font-bold">Mode Global View Aktif</h2>
        <p class="text-3xs text-blue-700/80 mt-0.5">
          Menampilkan seluruh kamar dari semua properti kos. Pilih properti spesifik pada menu atas untuk menambah atau mengelola kamar.
        </p>
      </div>
    </div>

    <!-- Summary Metrics (3 Cards) -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <!-- Total Kamar -->
      <div class="p-4 md:p-5 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200/80 dark:border-surface-800 shadow-2xs flex items-center justify-between">
        <div class="space-y-1">
          <span class="text-3xs font-bold uppercase tracking-wider text-surface-400">Total Kamar</span>
          <div class="text-xl md:text-2xl font-bold text-surface-900 dark:text-surface-50 font-outfit tabular-nums">
            {{ rooms.length }}
          </div>
          <span class="text-3xs text-surface-400 block">Unit terdaftar</span>
        </div>
        <div class="w-11 h-11 rounded-2xl bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 flex items-center justify-center flex-shrink-0">
          <PhDoor :size="22" weight="bold" />
        </div>
      </div>

      <!-- Kamar Terisi (Occupied) -->
      <div class="p-4 md:p-5 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200/80 dark:border-surface-800 shadow-2xs flex items-center justify-between">
        <div class="space-y-1">
          <span class="text-3xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Kamar Terisi</span>
          <div class="text-xl md:text-2xl font-bold text-brand-700 dark:text-brand-300 font-outfit tabular-nums">
            {{ occupiedRoomsCount }}
          </div>
          <span class="text-3xs text-surface-400 block">
            Okupansi {{ occupancyRate }}%
          </span>
        </div>
        <div class="w-11 h-11 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
          <PhUsers :size="22" weight="bold" />
        </div>
      </div>

      <!-- Kamar Kosong (Vacant) -->
      <div class="p-4 md:p-5 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200/80 dark:border-surface-800 shadow-2xs flex items-center justify-between">
        <div class="space-y-1">
          <span class="text-3xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Kamar Kosong</span>
          <div class="text-xl md:text-2xl font-bold text-emerald-700 dark:text-emerald-300 font-outfit tabular-nums">
            {{ availableRoomsCount }}
          </div>
          <span class="text-3xs text-surface-400 block">Siap disewakan</span>
        </div>
        <div class="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
          <PhCheckCircle :size="22" weight="bold" />
        </div>
      </div>
    </div>

    <!-- Filters & Search Toolbar -->
    <div class="bg-white dark:bg-surface-900 p-4 rounded-2xl border border-surface-200/80 dark:border-surface-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <!-- Status Tabs -->
      <div class="inline-flex p-1 bg-surface-100 dark:bg-surface-800 rounded-xl">
        <button 
          v-for="tab in ['all', 'available', 'occupied'] as const"
          :key="tab"
          @click="statusFilter = tab"
          type="button"
          class="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize"
          :class="statusFilter === tab 
            ? 'bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 shadow-2xs' 
            : 'text-surface-500 hover:text-surface-700 dark:text-surface-400'"
        >
          {{ tab === 'all' ? 'Semua' : (tab === 'available' ? 'Tersedia' : 'Terisi') }}
          <span class="ml-1 text-3xs opacity-70">
            ({{ getCountByStatus(tab) }})
          </span>
        </button>
      </div>

      <!-- Search Input -->
      <div class="relative w-full sm:w-72">
        <PhMagnifyingGlass :size="15" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Cari nomor kamar atau penghuni..."
          class="w-full pl-9 pr-4 py-2 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-xs text-surface-900 dark:text-surface-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
        />
      </div>
    </div>

    <!-- Responsive Card Grid Section -->
    <div>
      <!-- Skeleton Grid -->
      <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
        <div 
          v-for="i in 8" 
          :key="'skel-room-'+i" 
          class="p-5 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200/80 dark:border-surface-800 shadow-2xs animate-pulse space-y-4"
        >
          <div class="flex items-center justify-between">
            <div class="h-5 bg-surface-200 dark:bg-surface-800 rounded w-20"></div>
            <div class="h-4 bg-surface-200 dark:bg-surface-800 rounded-full w-16"></div>
          </div>
          <div class="h-4 bg-surface-200 dark:bg-surface-800 rounded w-28"></div>
          <div class="pt-3 border-t border-surface-100 dark:border-surface-800 flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-surface-200 dark:bg-surface-800"></div>
            <div class="h-3 bg-surface-200 dark:bg-surface-800 rounded w-24"></div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div 
        v-else-if="filteredRooms.length === 0" 
        class="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200/80 dark:border-surface-800 shadow-2xs p-12 text-center flex flex-col items-center justify-center gap-3"
      >
        <div class="w-14 h-14 rounded-2xl bg-surface-100 dark:bg-surface-800 text-surface-400 flex items-center justify-center">
          <PhDoor :size="28" weight="bold" />
        </div>
        <h3 class="text-sm font-bold text-surface-900 dark:text-surface-100 font-outfit">
          Tidak ada data kamar ditemukan
        </h3>
        <p class="text-xs text-surface-500 max-w-sm">
          {{ activePropertyId ? 'Belum ada kamar yang terdaftar di properti ini. Mulai dengan menambahkan kamar baru.' : 'Pilih properti spesifik untuk melihat daftar unit kamar.' }}
        </p>
        <button 
          v-if="activePropertyId"
          @click="openAddSlideOver"
          type="button"
          class="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-all shadow-2xs active:scale-95"
        >
          <PhPlus :size="14" weight="bold" />
          <span>Tambah Kamar Sekarang</span>
        </button>
      </div>

      <!-- Room Cards Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5" id="rooms-grid">
        <div 
          v-for="room in filteredRooms" 
          :key="room.id"
          @click="openDetailSlideOver(room)"
          class="p-5 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200/80 dark:border-surface-800 shadow-2xs hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700/60 transition-all cursor-pointer flex flex-col justify-between group space-y-4"
          :data-room-number="room.roomNumber"
        >
          <!-- Card Header: Room Number & Status Badge -->
          <div>
            <div class="flex items-center justify-between gap-2">
              <h3 class="font-bold text-base md:text-lg text-surface-900 dark:text-surface-50 font-outfit tracking-tight group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                Kamar {{ room.roomNumber }}
              </h3>

              <!-- Status Badge -->
              <span 
                v-if="room.status === 'available'"
                class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-3xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex-shrink-0"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Tersedia</span>
              </span>
              <span 
                v-else
                class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-3xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300 border border-brand-200 dark:border-brand-800 flex-shrink-0"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                <span>Terisi</span>
              </span>
            </div>

            <!-- Property name (if global view) -->
            <p v-if="!activePropertyId" class="text-3xs text-surface-400 font-medium mt-0.5 truncate">
              {{ room.property?.name || '-' }}
            </p>
          </div>

          <!-- Pricing & Breakdown -->
          <div class="space-y-1 bg-surface-50/70 dark:bg-surface-800/40 p-3 rounded-xl border border-surface-100 dark:border-surface-800">
            <span class="text-3xs font-bold uppercase tracking-wider text-surface-400 block">Total Tarif Sewa</span>
            <div class="text-sm font-bold text-surface-900 dark:text-surface-100 tabular-nums">
              Rp {{ calculateTotalRent(room).toLocaleString('id-ID') }}
              <span class="text-3xs font-normal text-surface-400">/ bln</span>
            </div>
            <div v-if="room.additionalFees && room.additionalFees.length > 0" class="text-3xs text-brand-600 dark:text-brand-400 font-medium">
              Pokok: Rp {{ Number(room.monthlyRate || 0).toLocaleString('id-ID') }} (+{{ room.additionalFees.length }} biaya)
            </div>
          </div>

          <!-- Card Footer: Current Tenant or Vacant Indicator -->
          <div class="pt-3 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between gap-2 text-xs">
            <div v-if="room.tenants && room.tenants.length > 0" class="flex items-center gap-2 truncate">
              <div class="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 font-bold text-2xs flex items-center justify-center flex-shrink-0">
                {{ room.tenants[0].name.charAt(0).toUpperCase() }}
              </div>
              <div class="truncate">
                <p class="font-bold text-surface-900 dark:text-surface-100 text-2xs truncate">
                  {{ room.tenants[0].name }}
                </p>
                <span class="text-3xs text-surface-400 font-mono block">
                  {{ room.tenants[0].phone || 'Penghuni Aktif' }}
                </span>
              </div>
            </div>

            <div v-else class="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-2xs font-semibold">
              <PhCheckCircle :size="14" weight="bold" />
              <span>Unit Kosong</span>
            </div>

            <!-- Quick Action Icon -->
            <button 
              @click.stop="openEditSlideOver(room)"
              title="Edit Kamar"
              type="button"
              class="p-1.5 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            >
              <PhPencilSimple :size="15" weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Room Form Slide-over (Create & Edit) -->
    <RoomFormSlideOver
      v-model="isFormOpen"
      :property-id="activePropertyId"
      :room="selectedRoomForEdit"
      @saved="onRoomSaved"
    />

    <!-- Room 360 Detail Slide-over -->
    <RoomDetailSlideOver
      v-model="isDetailOpen"
      :room="selectedRoomForDetail"
      @edit="openEditSlideOver"
      @deleted="onRoomSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePropertyState } from '~/composables/usePropertyState'
import { 
  PhPlus, 
  PhDoor, 
  PhUsers, 
  PhCheckCircle, 
  PhMagnifyingGlass, 
  PhPencilSimple 
} from '@phosphor-icons/vue'

definePageMeta({
  layout: 'dashboard',
})

const { activePropertyId } = usePropertyState()
const { addToast } = useToast()

const rooms = ref<any[]>([])
const isLoading = ref(false)

const searchQuery = ref('')
const statusFilter = ref<'all' | 'available' | 'occupied'>('all')

const isFormOpen = ref(false)
const isDetailOpen = ref(false)
const selectedRoomForEdit = ref<any | null>(null)
const selectedRoomForDetail = ref<any | null>(null)

const fetchRooms = async () => {
  isLoading.value = true
  try {
    const propertyQuery = activePropertyId.value ? `?propertyId=${activePropertyId.value}` : ''
    const res = await $fetch<any>(`/api/rooms${propertyQuery}`)
    if (res.status === 'success') {
      rooms.value = res.data?.data || res.data || []
    }
  } catch (err) {
    addToast('Gagal memuat data', 'Terjadi kesalahan saat mengambil daftar kamar.', 'error')
  } finally {
    isLoading.value = false
  }
}

watch(activePropertyId, () => {
  fetchRooms()
}, { immediate: true })

const filteredRooms = computed(() => {
  return rooms.value.filter(r => {
    // Status Filter
    if (statusFilter.value === 'available' && r.status !== 'available') return false
    if (statusFilter.value === 'occupied' && r.status !== 'occupied') return false

    // Search Query
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      const matchNumber = String(r.roomNumber || '').toLowerCase().includes(q)
      const matchTenant = r.tenants?.some((t: any) => t.name?.toLowerCase().includes(q))
      return matchNumber || matchTenant
    }

    return true
  })
})

const occupiedRoomsCount = computed(() => {
  return rooms.value.filter(r => r.status === 'occupied').length
})

const availableRoomsCount = computed(() => {
  return rooms.value.filter(r => r.status === 'available').length
})

const occupancyRate = computed(() => {
  if (rooms.value.length === 0) return 0
  return Math.round((occupiedRoomsCount.value / rooms.value.length) * 100)
})

const getCountByStatus = (status: 'all' | 'available' | 'occupied') => {
  if (status === 'all') return rooms.value.length
  if (status === 'available') return availableRoomsCount.value
  return occupiedRoomsCount.value
}

const openAddSlideOver = () => {
  selectedRoomForEdit.value = null
  isFormOpen.value = true
}

const openEditSlideOver = (room: any) => {
  selectedRoomForEdit.value = room
  isFormOpen.value = true
}

const openDetailSlideOver = (room: any) => {
  selectedRoomForDetail.value = room
  isDetailOpen.value = true
}

const onRoomSaved = async () => {
  await fetchRooms()
  // Refresh detail room data if currently open
  if (selectedRoomForDetail.value?.id) {
    const updated = rooms.value.find(r => r.id === selectedRoomForDetail.value.id)
    if (updated) {
      selectedRoomForDetail.value = updated
    }
  }
}

const calculateTotalRent = (room: any) => {
  const base = Number(room.monthlyRate) || 0
  const fees = (room.additionalFees || []).reduce((sum: number, fee: any) => sum + (Number(fee.amount) || 0), 0)
  return base + fees
}
</script>
