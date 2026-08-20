<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePropertyState } from '~/composables/usePropertyState'
import { useAuth } from '#imports'
import { useToast } from '~/composables/useToast'
import { useConfirm } from '~/composables/useConfirm'
import { 
  PhBuildings, 
  PhPlus, 
  PhPencilSimple, 
  PhTrash, 
  PhDoor, 
  PhUsers, 
  PhChartPieSlice, 
  PhMapPin, 
  PhMagnifyingGlass, 
  PhArrowRight,
  PhCalendarBlank,
  PhCheckCircle
} from '@phosphor-icons/vue'

definePageMeta({
  layout: 'dashboard',
  middleware: ['owner']
})

const { properties, loadProperties, isLoading, setActiveProperty } = usePropertyState()
const { data } = useAuth()
const { addToast } = useToast()
const { confirm } = useConfirm()

const isSuperadmin = computed(() => (data.value?.user as any)?.role === 'superadmin')
const isOwner = computed(() => (data.value?.user as any)?.role === 'owner')
const canManage = computed(() => isSuperadmin.value || isOwner.value)

// Search filter
const searchQuery = ref('')

// Slide-over state
const isSlideOverOpen = ref(false)
const selectedProperty = ref<any | null>(null)

onMounted(async () => {
  await loadProperties(true)
})

// Metrics computation
const totalPropertiesCount = computed(() => properties.value.length)

const totalCapacityCount = computed(() => {
  return properties.value.reduce((acc, p) => acc + (Number(p.totalRooms) || 0), 0)
})

const totalOccupiedCount = computed(() => {
  return properties.value.reduce((acc, p) => acc + (Number(p.occupiedRooms) || 0), 0)
})

const avgOccupancyRate = computed(() => {
  if (totalCapacityCount.value === 0) return 0
  return Math.round((totalOccupiedCount.value / totalCapacityCount.value) * 100)
})

// Filtered properties
const filteredProperties = computed(() => {
  if (!searchQuery.value.trim()) return properties.value
  const q = searchQuery.value.toLowerCase().trim()
  return properties.value.filter(p => 
    p.name.toLowerCase().includes(q) || 
    (p.address && p.address.toLowerCase().includes(q))
  )
})

// Action Handlers
const openAddSlideOver = () => {
  selectedProperty.value = null
  isSlideOverOpen.value = true
}

const openEditSlideOver = (prop: any) => {
  selectedProperty.value = { ...prop }
  isSlideOverOpen.value = true
}

const handlePropertySaved = async () => {
  await loadProperties(true)
}

const navigateToRooms = (propId: string) => {
  setActiveProperty(propId)
  navigateTo('/rooms')
}

const deleteProperty = async (prop: any) => {
  const isConfirmed = await confirm({
    title: 'Hapus Properti',
    message: `Apakah Anda yakin ingin menghapus "${prop.name}"? Semua kamar, data tagihan, dan pengeluaran terkait akan dihapus secara permanen.`,
    confirmText: 'Ya, Hapus',
    cancelText: 'Batal',
    type: 'danger'
  })

  if (!isConfirmed) return

  try {
    await $fetch(`/api/properties/${prop.id}`, {
      method: 'DELETE'
    })
    await loadProperties(true)
    addToast('Berhasil', `Properti "${prop.name}" berhasil dihapus!`, 'success')
  } catch (err: any) {
    addToast('Gagal', err.data?.statusMessage || 'Gagal menghapus properti.', 'error')
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header & Action -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50 font-outfit tracking-tight">
          Manajemen Properti
        </h1>
        <p class="text-xs text-surface-500 dark:text-surface-400 mt-1">
          Kelola portofolio cabang kos, kapasitas kamar, dan pantau tingkat okupansi real-time.
        </p>
      </div>

      <div v-if="canManage" class="flex items-center gap-3">
        <button 
          @click="openAddSlideOver"
          id="btn-add-property"
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-all shadow-sm active:scale-95 whitespace-nowrap min-h-[42px]"
        >
          <PhPlus :size="16" weight="bold" />
          <span>Tambah Properti</span>
        </button>
      </div>
    </div>

    <!-- Summary Metrics (3 Cards) -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <!-- Total Properti -->
      <div class="p-4 md:p-5 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200/80 dark:border-surface-800 shadow-2xs flex items-center justify-between">
        <div class="space-y-1">
          <span class="text-3xs font-bold uppercase tracking-wider text-surface-400">Total Properti</span>
          <div class="text-xl md:text-2xl font-bold text-surface-900 dark:text-surface-50 font-outfit tabular-nums">
            {{ totalPropertiesCount }}
          </div>
          <span class="text-3xs text-surface-400 block">Cabang portofolio aktif</span>
        </div>
        <div class="w-11 h-11 rounded-2xl bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 flex items-center justify-center flex-shrink-0">
          <PhBuildings :size="22" weight="bold" />
        </div>
      </div>

      <!-- Total Kapasitas Kamar -->
      <div class="p-4 md:p-5 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200/80 dark:border-surface-800 shadow-2xs flex items-center justify-between">
        <div class="space-y-1">
          <span class="text-3xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Total Kapasitas</span>
          <div class="text-xl md:text-2xl font-bold text-brand-700 dark:text-brand-300 font-outfit tabular-nums">
            {{ totalCapacityCount }}
          </div>
          <span class="text-3xs text-surface-400 block">Kamar di seluruh cabang</span>
        </div>
        <div class="w-11 h-11 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
          <PhDoor :size="22" weight="bold" />
        </div>
      </div>

      <!-- Rata-rata Okupansi -->
      <div class="p-4 md:p-5 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200/80 dark:border-surface-800 shadow-2xs flex items-center justify-between">
        <div class="space-y-1">
          <span class="text-3xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Rata-rata Okupansi</span>
          <div class="text-xl md:text-2xl font-bold text-emerald-700 dark:text-emerald-300 font-outfit tabular-nums">
            {{ avgOccupancyRate }}%
          </div>
          <span class="text-3xs text-surface-400 block">
            {{ totalOccupiedCount }} dari {{ totalCapacityCount }} unit terisi
          </span>
        </div>
        <div class="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
          <PhChartPieSlice :size="22" weight="bold" />
        </div>
      </div>
    </div>

    <!-- Toolbar / Search Bar -->
    <div class="bg-white dark:bg-surface-900 p-4 rounded-2xl border border-surface-200/80 dark:border-surface-800 shadow-2xs flex items-center justify-between gap-3">
      <div class="relative flex-1 max-w-md">
        <PhMagnifyingGlass :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Cari properti berdasarkan nama atau alamat..."
          class="w-full bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100 rounded-xl pl-10 pr-3.5 py-2 text-xs font-medium focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all min-h-[40px]"
        />
      </div>
      <div class="text-3xs font-bold text-surface-400 uppercase tracking-wider hidden sm:block">
        Menampilkan {{ filteredProperties.length }} properti
      </div>
    </div>

    <!-- Properties Card Grid -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      <div v-for="i in 6" :key="'prop-skel-'+i" class="p-5 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200/80 dark:border-surface-800 shadow-2xs space-y-4">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="skeleton w-12 h-12 rounded-2xl"></div>
            <div class="space-y-1.5">
              <div class="skeleton h-4 w-32 rounded"></div>
              <div class="skeleton h-3 w-48 rounded"></div>
            </div>
          </div>
        </div>
        <div class="skeleton h-2 w-full rounded-full"></div>
        <div class="grid grid-cols-3 gap-2">
          <div class="skeleton h-12 rounded-xl"></div>
          <div class="skeleton h-12 rounded-xl"></div>
          <div class="skeleton h-12 rounded-xl"></div>
        </div>
        <div class="skeleton h-10 w-full rounded-xl"></div>
      </div>
    </div>

    <div v-else-if="filteredProperties.length > 0" id="properties-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      <div 
        v-for="prop in filteredProperties" 
        :key="prop.id"
        class="p-5 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200/80 dark:border-surface-800 shadow-2xs hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700 transition-all flex flex-col justify-between group"
      >
        <div class="space-y-4">
          <!-- Property Header & Quick Actions -->
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3 min-w-0">
              <div class="w-11 h-11 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <PhBuildings :size="22" weight="duotone" />
              </div>
              <div class="min-w-0 flex-1">
                <h3 class="text-sm font-bold text-surface-900 dark:text-surface-100 font-outfit truncate" :title="prop.name">
                  {{ prop.name }}
                </h3>
                <p class="text-xs text-surface-500 dark:text-surface-400 flex items-start gap-1 mt-0.5 line-clamp-1" :title="prop.address || 'Alamat belum diatur'">
                  <PhMapPin :size="13" weight="bold" class="flex-shrink-0 mt-0.5 text-surface-400" />
                  <span>{{ prop.address || 'Alamat belum diatur' }}</span>
                </p>
              </div>
            </div>

            <!-- Card Actions -->
            <div v-if="canManage" class="flex items-center gap-1 flex-shrink-0">
              <button 
                @click="openEditSlideOver(prop)"
                type="button"
                title="Edit Properti"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
              >
                <PhPencilSimple :size="16" weight="bold" />
              </button>
              <button 
                @click="deleteProperty(prop)"
                type="button"
                title="Hapus Properti"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/40 transition-colors"
              >
                <PhTrash :size="16" weight="bold" />
              </button>
            </div>
          </div>

          <!-- Occupancy Rate & Progress Bar -->
          <div class="space-y-2 pt-1">
            <div class="flex items-center justify-between text-2xs">
              <span class="font-bold uppercase tracking-wider text-surface-500">Okupansi</span>
              <span 
                class="px-2 py-0.5 rounded-full font-bold tabular-nums"
                :class="{
                  'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400': (Number(prop.totalRooms) > 0 && Math.round((Number(prop.occupiedRooms) / Number(prop.totalRooms)) * 100) >= 80),
                  'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400': (Number(prop.totalRooms) > 0 && Math.round((Number(prop.occupiedRooms) / Number(prop.totalRooms)) * 100) > 0 && Math.round((Number(prop.occupiedRooms) / Number(prop.totalRooms)) * 100) < 80),
                  'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400': Number(prop.totalRooms) === 0 || Number(prop.occupiedRooms) === 0
                }"
              >
                {{ Number(prop.totalRooms) > 0 ? Math.round((Number(prop.occupiedRooms) / Number(prop.totalRooms)) * 100) : 0 }}%
              </span>
            </div>

            <!-- Progress Bar -->
            <div class="w-full h-2 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
              <div 
                class="h-full rounded-full transition-all duration-500"
                :class="{
                  'bg-emerald-500': (Number(prop.totalRooms) > 0 && Math.round((Number(prop.occupiedRooms) / Number(prop.totalRooms)) * 100) >= 80),
                  'bg-brand-500': (Number(prop.totalRooms) > 0 && Math.round((Number(prop.occupiedRooms) / Number(prop.totalRooms)) * 100) < 80),
                  'bg-surface-300': Number(prop.totalRooms) === 0
                }"
                :style="{ width: `${Number(prop.totalRooms) > 0 ? (Number(prop.occupiedRooms) / Number(prop.totalRooms)) * 100 : 0}%` }"
              />
            </div>
          </div>

          <!-- Room Stats Sub-Cards -->
          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="p-2.5 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-100 dark:border-surface-800/80">
              <span class="text-3xs text-surface-400 font-medium block">Total</span>
              <span class="text-xs font-bold text-surface-900 dark:text-surface-100 tabular-nums">
                {{ prop.totalRooms || 0 }}
              </span>
            </div>

            <div class="p-2.5 rounded-xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-100/60 dark:border-brand-900/40">
              <span class="text-3xs text-brand-600 dark:text-brand-400 font-medium block">Terisi</span>
              <span class="text-xs font-bold text-brand-700 dark:text-brand-300 tabular-nums">
                {{ prop.occupiedRooms || 0 }}
              </span>
            </div>

            <div class="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/60 dark:border-emerald-900/40">
              <span class="text-3xs text-emerald-600 dark:text-emerald-400 font-medium block">Kosong</span>
              <span class="text-xs font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                {{ Math.max(0, (Number(prop.totalRooms) || 0) - (Number(prop.occupiedRooms) || 0)) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Footer / Manage Rooms CTA -->
        <div class="mt-5 pt-4 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between">
          <span class="text-3xs text-surface-400 flex items-center gap-1 tabular-nums">
            <PhCalendarBlank :size="12" />
            <span>{{ new Date(prop.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) }}</span>
          </span>

          <button 
            @click="navigateToRooms(prop.id)"
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-950/50 transition-colors group/btn"
          >
            <span>Kelola Kamar</span>
            <PhArrowRight :size="12" weight="bold" class="group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div 
      v-else 
      class="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200/80 dark:border-surface-800 p-12 text-center space-y-4 shadow-2xs"
    >
      <div class="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 mx-auto flex items-center justify-center ring-8 ring-brand-50/50 dark:ring-brand-950/20">
        <PhBuildings :size="32" weight="duotone" />
      </div>
      <div class="space-y-1 max-w-sm mx-auto">
        <h3 class="text-base font-bold text-surface-900 dark:text-surface-100 font-outfit">
          {{ searchQuery ? 'Properti Tidak Ditemukan' : 'Belum Ada Properti Terdaftar' }}
        </h3>
        <p class="text-xs text-surface-500 dark:text-surface-400">
          {{ searchQuery ? 'Tidak ada properti yang cocok dengan kata kunci pencarian Anda.' : 'Mulai kelola kos Anda dengan menambahkan cabang properti pertama ke dalam sistem.' }}
        </p>
      </div>
      <div v-if="canManage && !searchQuery" class="pt-2">
        <button 
          @click="openAddSlideOver"
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 transition-all shadow-sm active:scale-95"
        >
          <PhPlus :size="16" weight="bold" />
          <span>Tambah Properti Pertama</span>
        </button>
      </div>
    </div>

    <!-- Slide-over Off-canvas Component -->
    <PropertyFormSlideOver 
      v-model="isSlideOverOpen" 
      :property-data="selectedProperty"
      @saved="handlePropertySaved"
    />
  </div>
</template>
