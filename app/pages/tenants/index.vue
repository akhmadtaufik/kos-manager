<template>
  <div class="space-y-6">
    <!-- Page Header & Actions -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50 font-outfit tracking-tight">
          Direktori Penghuni
        </h1>
        <p class="text-xs text-surface-500 dark:text-surface-400 mt-1">
          Kelola data penyewa, riwayat kamar, domisili Kemendagri, dan pantau status tagihan finansial.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Add Tenant Primary Button -->
        <button 
          @click="openAddSlideOver"
          id="btn-onboard-tenant"
          type="button"
          :disabled="!activePropertyId"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-all shadow-sm active:scale-95 whitespace-nowrap"
        >
          <PhUserPlus :size="16" weight="bold" />
          <span>Pendaftaran Penghuni</span>
        </button>
      </div>
    </div>

    <!-- Mode Global View Alert when no property selected -->
    <div v-if="!activePropertyId" class="bg-blue-50/70 text-blue-800 p-4 rounded-2xl border border-blue-200/60 flex items-center gap-3">
      <div class="flex-1 text-xs">
        <h2 class="font-bold">Mode Global View Aktif</h2>
        <p class="text-3xs text-blue-700/80 mt-0.5">Menampilkan seluruh penghuni dari semua properti kos. Pilih properti spesifik pada menu atas untuk mendaftarkan penghuni baru.</p>
      </div>
    </div>

    <!-- Filters & Search Toolbar -->
    <div class="bg-white dark:bg-surface-900 p-4 rounded-2xl border border-surface-200/80 dark:border-surface-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <!-- Status Tabs -->
      <div class="inline-flex p-1 bg-surface-100 dark:bg-surface-800 rounded-xl">
        <button 
          v-for="tab in ['all', 'active', 'inactive'] as const"
          :key="tab"
          @click="statusFilter = tab"
          class="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize"
          :class="statusFilter === tab 
            ? 'bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 shadow-2xs' 
            : 'text-surface-500 hover:text-surface-700 dark:text-surface-400'"
        >
          {{ tab === 'all' ? 'Semua' : (tab === 'active' ? 'Aktif' : 'Non-Aktif') }}
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
          placeholder="Cari nama, kamar, atau HP..."
          class="w-full pl-9 pr-4 py-2 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-xs text-surface-900 dark:text-surface-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
        />
      </div>
    </div>

    <!-- SaaS Directory Data Table -->
    <div class="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200/80 dark:border-surface-800 shadow-2xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-xs text-left text-surface-600 dark:text-surface-300">
          <thead class="text-3xs uppercase tracking-wider text-surface-400 bg-surface-50/80 dark:bg-surface-850 border-b border-surface-100 dark:border-surface-800 font-bold font-mono">
            <tr>
              <th v-if="!activePropertyId" scope="col" class="px-6 py-4">Properti</th>
              <th scope="col" class="px-6 py-4">Nama Penghuni</th>
              <th scope="col" class="px-6 py-4">Kontak & Darurat</th>
              <th scope="col" class="px-6 py-4">Domisili Asal</th>
              <th scope="col" class="px-6 py-4">Check In</th>
              <th scope="col" class="px-6 py-4">Status</th>
              <th scope="col" class="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
            <!-- Loading Skeleton -->
            <template v-if="isLoading">
              <tr v-for="i in 4" :key="'skel-'+i" class="animate-pulse">
                <td v-if="!activePropertyId" class="px-6 py-4.5"><div class="h-3.5 bg-surface-200 rounded w-24"></div></td>
                <td class="px-6 py-4.5"><div class="h-3.5 bg-surface-200 rounded w-32"></div></td>
                <td class="px-6 py-4.5"><div class="h-3.5 bg-surface-200 rounded w-28"></div></td>
                <td class="px-6 py-4.5"><div class="h-3.5 bg-surface-200 rounded w-36"></div></td>
                <td class="px-6 py-4.5"><div class="h-3.5 bg-surface-200 rounded w-20"></div></td>
                <td class="px-6 py-4.5"><div class="h-3.5 bg-surface-200 rounded w-16"></div></td>
                <td class="px-6 py-4.5 text-right"><div class="h-3.5 bg-surface-200 rounded w-16 ml-auto"></div></td>
              </tr>
            </template>

            <!-- Empty State -->
            <tr v-else-if="filteredTenants.length === 0">
              <td :colspan="activePropertyId ? 6 : 7" class="px-6 py-12 text-center text-surface-400">
                <div class="flex flex-col items-center justify-center gap-2">
                  <PhUsers :size="32" class="text-surface-300 dark:text-surface-700" />
                  <p class="font-semibold text-xs text-surface-600 dark:text-surface-300">Tidak ada data penghuni ditemukan.</p>
                  <p class="text-3xs text-surface-400">Silakan daftarkan penghuni baru untuk properti ini.</p>
                </div>
              </td>
            </tr>

            <!-- Table Rows -->
            <template v-else>
              <tr 
                v-for="tenant in filteredTenants" 
                :key="tenant.id"
                @click="openProfileSlideOver(tenant)"
                class="hover:bg-surface-50/70 dark:hover:bg-surface-800/40 cursor-pointer transition-colors group"
              >
                <!-- Property (if global view) -->
                <td v-if="!activePropertyId" class="px-6 py-4.5 font-medium text-surface-700 dark:text-surface-300">
                  {{ tenant.room?.property?.name || '-' }}
                </td>

                <!-- Tenant Name -->
                <td class="px-6 py-4.5 font-bold text-surface-900 dark:text-surface-100">
                  {{ tenant.name }}
                </td>

                <!-- Contact & Emergency -->
                <td class="px-6 py-4.5">
                  <div class="font-mono text-2xs tabular-nums text-surface-700 dark:text-surface-300">
                    {{ tenant.phone || '-' }}
                  </div>
                  <div v-if="tenant.emergencyContact" class="text-3xs text-surface-400 truncate max-w-[160px]" :title="tenant.emergencyContact">
                    Darurat: {{ tenant.emergencyContact }}
                  </div>
                </td>

                <!-- Demographics (Kemendagri) -->
                <td class="px-6 py-4.5">
                  <div class="text-2xs font-medium text-surface-700 dark:text-surface-300 max-w-[180px] truncate" :title="tenant.location?.formattedAddress">
                    {{ tenant.location?.formattedAddress || '-' }}
                  </div>
                </td>

                <!-- Check In Date -->
                <td class="px-6 py-4.5 text-2xs text-surface-500 tabular-nums">
                  {{ formatDate(tenant.checkIn) }}
                </td>

                <!-- Minimalist Dot-Badge Status -->
                <td class="px-6 py-4.5">
                  <span 
                    v-if="tenant.isActive === 1"
                    class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-3xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Aktif</span>
                  </span>
                  <span 
                    v-else
                    class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-3xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    <span>Non-Aktif</span>
                  </span>
                </td>

                <!-- Actions Icons -->
                <td class="px-6 py-4.5 text-right" @click.stop>
                  <div class="flex items-center justify-end gap-1">
                    <!-- View 360 Profile -->
                    <button 
                      @click="openProfileSlideOver(tenant)"
                      title="Lihat Profil 360"
                      class="p-1.5 rounded-lg text-surface-500 hover:text-brand-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                    >
                      <PhEye :size="16" weight="bold" />
                    </button>

                    <!-- Edit -->
                    <button 
                      @click="openEditSlideOver(tenant)"
                      title="Edit Data"
                      class="p-1.5 rounded-lg text-surface-500 hover:text-brand-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                    >
                      <PhPencilSimple :size="16" weight="bold" />
                    </button>

                    <!-- Check Out (Only if active) -->
                    <button 
                      v-if="tenant.isActive === 1"
                      @click="handleCheckout(tenant.id)"
                      title="Check Out Penghuni"
                      class="p-1.5 rounded-lg text-surface-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                    >
                      <PhSignOut :size="16" weight="bold" />
                    </button>

                    <!-- Delete -->
                    <button 
                      @click="handleDelete(tenant.id)"
                      title="Hapus Historis"
                      class="p-1.5 rounded-lg text-surface-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <PhTrash :size="16" weight="bold" />
                    </button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Onboarding & Edit Slide-over Component -->
    <TenantFormSlideOver
      v-model="isFormOpen"
      :tenant="selectedTenantForEdit"
      :property-id="activePropertyId"
      :available-rooms="availableRooms"
      @saved="onTenantSaved"
    />

    <!-- Tenant 360 View Profile Slide-over Component -->
    <TenantProfileSlideOver
      v-model="isProfileOpen"
      :tenant-id="selectedTenantForProfile?.id || null"
      @edit="openEditSlideOver"
      @checkout="handleCheckout"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePropertyState } from '~/composables/usePropertyState'
import { useConfirm } from '~/composables/useConfirm'
import { 
  PhUserPlus, 
  PhUsers, 
  PhMagnifyingGlass, 
  PhEye, 
  PhPencilSimple, 
  PhSignOut, 
  PhTrash 
} from '@phosphor-icons/vue'

definePageMeta({
  layout: 'dashboard',
})

const { activePropertyId } = usePropertyState()
const { addToast } = useToast()
const { confirm } = useConfirm()

const tenants = ref<any[]>([])
const availableRooms = ref<any[]>([])
const isLoading = ref(false)

const searchQuery = ref('')
const statusFilter = ref<'all' | 'active' | 'inactive'>('all')

const isFormOpen = ref(false)
const isProfileOpen = ref(false)
const selectedTenantForEdit = ref<any | null>(null)
const selectedTenantForProfile = ref<any | null>(null)

const fetchTenants = async () => {
  isLoading.value = true
  try {
    const propertyQuery = activePropertyId.value ? `?propertyId=${activePropertyId.value}` : ''
    const res = await $fetch<any>(`/api/tenants${propertyQuery}`)
    if (res.status === 'success') {
      tenants.value = res.data?.data || res.data || []
    }
  } catch (err) {
    addToast('Gagal memuat data', 'Terjadi kesalahan saat mengambil daftar penghuni.', 'error')
  } finally {
    isLoading.value = false
  }
}

const fetchAvailableRooms = async () => {
  if (!activePropertyId.value) return
  try {
    const res = await $fetch<any>(`/api/rooms?propertyId=${activePropertyId.value}`)
    if (res.status === 'success') {
      const data = res.data?.data || res.data || []
      availableRooms.value = data.filter((r: any) => r.status === 'available')
    }
  } catch (err) {
    console.error('Failed to fetch rooms', err)
  }
}

watch(activePropertyId, () => {
  fetchTenants()
  fetchAvailableRooms()
}, { immediate: true })

const filteredTenants = computed(() => {
  return tenants.value.filter(t => {
    // Status Filter
    if (statusFilter.value === 'active' && t.isActive !== 1) return false
    if (statusFilter.value === 'inactive' && t.isActive === 1) return false

    // Search Query
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      const matchName = t.name?.toLowerCase().includes(q)
      const matchRoom = t.room?.roomNumber?.toLowerCase().includes(q)
      const matchPhone = t.phone?.toLowerCase().includes(q)
      return matchName || matchRoom || matchPhone
    }

    return true
  })
})

const getCountByStatus = (status: 'all' | 'active' | 'inactive') => {
  if (status === 'all') return tenants.value.length
  if (status === 'active') return tenants.value.filter(t => t.isActive === 1).length
  return tenants.value.filter(t => t.isActive !== 1).length
}

const openAddSlideOver = () => {
  selectedTenantForEdit.value = null
  isFormOpen.value = true
}

const openEditSlideOver = (tenant: any) => {
  selectedTenantForEdit.value = tenant
  isFormOpen.value = true
}

const openProfileSlideOver = (tenant: any) => {
  selectedTenantForProfile.value = tenant
  isProfileOpen.value = true
}

const onTenantSaved = async () => {
  await fetchTenants()
  await fetchAvailableRooms()
}

const handleCheckout = async (id: string) => {
  const isConfirmed = await confirm({
    title: 'Checkout Penghuni',
    message: 'Apakah Anda yakin ingin menyelesaikan sewa penghuni ini? Kamar akan otomatis kembali berstatus Tersedia.',
    confirmText: 'Ya, Checkout',
    cancelText: 'Batal',
    type: 'warning'
  })

  if (!isConfirmed) return

  try {
    await $fetch(`/api/tenants/${id}`, {
      method: 'PATCH',
      body: { action: 'checkout' }
    })
    await fetchTenants()
    await fetchAvailableRooms()
    addToast('Berhasil', 'Checkout penghuni berhasil diselesaikan.', 'success')
  } catch (err: any) {
    addToast('Gagal', err.data?.statusMessage || 'Gagal melakukan checkout.', 'error')
  }
}

const handleDelete = async (id: string) => {
  const isConfirmed = await confirm({
    title: 'Hapus Data Penghuni',
    message: 'Apakah Anda yakin ingin menghapus data historis penghuni ini secara permanen? Tindakan ini tidak dapat dibatalkan.',
    confirmText: 'Ya, Hapus',
    cancelText: 'Batal',
    type: 'danger'
  })

  if (!isConfirmed) return

  try {
    await $fetch(`/api/tenants/${id}`, {
      method: 'DELETE'
    })
    await fetchTenants()
    addToast('Berhasil', 'Data historis penghuni berhasil dihapus.', 'success')
  } catch (err: any) {
    addToast('Gagal', err.data?.statusMessage || 'Gagal menghapus data.', 'error')
  }
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(dateString))
}
</script>
