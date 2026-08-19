<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePropertyState } from '~/composables/usePropertyState'
import { useAuth } from '#imports'
import { useConfirm } from '~/composables/useConfirm'
import { 
  PhUsersThree, 
  PhUserPlus, 
  PhKey, 
  PhTrash, 
  PhX, 
  PhDoor, 
  PhCreditCard, 
  PhReceipt, 
  PhChartLine, 
  PhShieldCheck,
  PhCheckSquare,
  PhSquare
} from '@phosphor-icons/vue'

definePageMeta({
  layout: 'dashboard',
  middleware: ['owner']
})

const { activePropertyId, activeProperty } = usePropertyState()
const { data: authData } = useAuth()
const { addToast } = useToast()
const { confirm } = useConfirm()
const isOwner = computed(() => ['superadmin', 'owner'].includes((authData.value?.user as any)?.role))

const staffList = ref<any[]>([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const emailToInvite = ref('')

// Granular Micro-Permissions Definitions Grouped by Module
interface MicroPermission {
  id: string
  label: string
  description: string
}

interface PermissionModule {
  id: string
  title: string
  description: string
  icon: any
  permissions: MicroPermission[]
}

const PERMISSION_MODULES: PermissionModule[] = [
  {
    id: 'rooms',
    title: 'Manajemen Kamar',
    description: 'Akses inventaris kamar, tipe, dan pengelolaan tarif.',
    icon: PhDoor,
    permissions: [
      { id: 'rooms:read', label: 'Lihat Kamar', description: 'Melihat daftar dan rincian data kamar' },
      { id: 'rooms:create', label: 'Tambah Kamar', description: 'Menambahkan kamar baru ke properti' },
      { id: 'rooms:update', label: 'Edit Kamar', description: 'Mengubah nomor kamar dan tarif sewa bulanan' },
      { id: 'rooms:delete', label: 'Hapus Kamar', description: 'Menghapus data kamar dari properti' }
    ]
  },
  {
    id: 'tenants',
    title: 'Manajemen Penghuni',
    description: 'Akses pendaftaran, identitas, dan data kontak penghuni.',
    icon: PhUsersThree,
    permissions: [
      { id: 'tenants:read', label: 'Lihat Penghuni', description: 'Melihat daftar dan profil penghuni kos' },
      { id: 'tenants:create', label: 'Check-in Penghuni', description: 'Mendaftarkan dan menempatkan penghuni baru' },
      { id: 'tenants:update', label: 'Edit Penghuni', description: 'Mengubah biodata atau nomor kontak penghuni' },
      { id: 'tenants:delete', label: 'Checkout / Hapus', description: 'Mengeluarkan penghuni atau menghapus data' }
    ]
  },
  {
    id: 'payments',
    title: 'Tagihan & Pembayaran',
    description: 'Akses penagihan sewa, invoice bulanan, dan pelunasan.',
    icon: PhCreditCard,
    permissions: [
      { id: 'payments:read', label: 'Lihat Tagihan', description: 'Melihat riwayat transaksi dan invoice sewa' },
      { id: 'payments:create', label: 'Buat Tagihan', description: 'Membuat atau generate tagihan sewa bulanan' },
      { id: 'payments:update', label: 'Konfirmasi Bayar', description: 'Memverifikasi dan menandai tagihan telah lunas' },
      { id: 'payments:delete', label: 'Batalkan Tagihan', description: 'Menghapus atau membatalkan invoice tagihan' }
    ]
  },
  {
    id: 'expenses',
    title: 'Manajemen Pengeluaran',
    description: 'Akses pencatatan dan pelaporan biaya operasional kos.',
    icon: PhReceipt,
    permissions: [
      { id: 'expenses:read', label: 'Lihat Pengeluaran', description: 'Melihat catatan riwayat biaya operasional' },
      { id: 'expenses:create', label: 'Catat Pengeluaran', description: 'Menambahkan transaksi pengeluaran baru' },
      { id: 'expenses:update', label: 'Edit Pengeluaran', description: 'Memperbarui rincian atau nominal pengeluaran' },
      { id: 'expenses:delete', label: 'Hapus Pengeluaran', description: 'Menghapus catatan bukti pengeluaran' }
    ]
  },
  {
    id: 'reports',
    title: 'Laporan & Rekapitulasi',
    description: 'Akses analisis finansial, okupansi, dan demografi.',
    icon: PhChartLine,
    permissions: [
      { id: 'reports:read', label: 'Lihat Rekapitulasi', description: 'Melihat rekap keuangan dan statistik demografi' }
    ]
  }
]

const ALL_PERMISSION_IDS = PERMISSION_MODULES.flatMap(m => m.permissions.map(p => p.id))

const isPermissionModalOpen = ref(false)
const selectedStaff = ref<any>(null)
const selectedPermissions = ref<string[]>([])
const isSavingPermissions = ref(false)

const fetchStaff = async () => {
  if (!activePropertyId.value) return
  isLoading.value = true
  try {
    const res = await $fetch<any>(`/api/staff?propertyId=${activePropertyId.value}`)
    if (res.status === 'success') {
      staffList.value = res.data?.data || res.data || []
    }
  } catch (err) {
    addToast('Gagal memuat data', 'Terjadi kesalahan saat mengambil daftar staf.', 'error')
  } finally {
    isLoading.value = false
  }
}

watch(activePropertyId, () => {
  fetchStaff()
}, { immediate: true })

const inviteOperator = async () => {
  if (!activePropertyId.value || !emailToInvite.value) return
  isSubmitting.value = true
  
  try {
    const res: any = await $fetch('/api/staff', {
      method: 'POST',
      body: {
        propertyId: activePropertyId.value,
        email: emailToInvite.value
      }
    })
    addToast('Berhasil', res.message || 'Operator berhasil ditambahkan', 'success')
    emailToInvite.value = ''
    await fetchStaff()
  } catch (err: any) {
    addToast('Gagal', err.data?.message || err.message || 'Gagal menambahkan operator', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const removeOperator = async (userId: string) => {
  const isConfirmed = await confirm({
    title: 'Cabut Akses Operator',
    message: 'Apakah Anda yakin ingin mencabut seluruh hak akses operator ini dari properti aktif?',
    confirmText: 'Ya, Cabut Akses',
    cancelText: 'Batal',
    type: 'danger'
  })

  if (!isConfirmed) return

  try {
    const res: any = await $fetch(`/api/staff/${userId}?propertyId=${activePropertyId.value}`, {
      method: 'DELETE'
    })
    addToast('Berhasil', res.message || 'Akses berhasil dicabut', 'success')
    await fetchStaff()
  } catch (err: any) {
    addToast('Gagal', err.data?.message || err.message || 'Gagal mencabut akses.', 'error')
  }
}

const openPermissionModal = (staff: any) => {
  selectedStaff.value = staff
  
  // Normalise permissions: if they have legacy macros, map them to micro-permissions
  const currentPerms = (staff.permissions as string[]) || []
  const normalised: string[] = []
  
  for (const perm of currentPerms) {
    if (perm === 'manage_rooms') {
      normalised.push('rooms:read', 'rooms:create', 'rooms:update', 'rooms:delete')
    } else if (perm === 'manage_tenants') {
      normalised.push('tenants:read', 'tenants:create', 'tenants:update', 'tenants:delete')
    } else if (perm === 'manage_payments') {
      normalised.push('payments:read', 'payments:create', 'payments:update', 'payments:delete')
    } else if (perm === 'manage_expenses') {
      normalised.push('expenses:read', 'expenses:create', 'expenses:update', 'expenses:delete')
    } else if (perm === 'view_reports') {
      normalised.push('reports:read')
    } else if (ALL_PERMISSION_IDS.includes(perm)) {
      normalised.push(perm)
    }
  }

  selectedPermissions.value = [...new Set(normalised)]
  isPermissionModalOpen.value = true
}

const closePermissionModal = () => {
  isPermissionModalOpen.value = false
  selectedStaff.value = null
  selectedPermissions.value = []
}

const togglePermission = (id: string) => {
  if (selectedPermissions.value.includes(id)) {
    selectedPermissions.value = selectedPermissions.value.filter((p: string) => p !== id)
  } else {
    selectedPermissions.value.push(id)
  }
}

const isModuleAllSelected = (module: PermissionModule) => {
  return module.permissions.every(p => selectedPermissions.value.includes(p.id))
}

const toggleModuleAll = (module: PermissionModule) => {
  const modulePermIds = module.permissions.map(p => p.id)
  if (isModuleAllSelected(module)) {
    selectedPermissions.value = selectedPermissions.value.filter(p => !modulePermIds.includes(p))
  } else {
    selectedPermissions.value = [...new Set([...selectedPermissions.value, ...modulePermIds])]
  }
}

const savePermissions = async () => {
  if (!selectedStaff.value || !activePropertyId.value) return
  isSavingPermissions.value = true
  
  try {
    const res: any = await $fetch(`/api/staff/${selectedStaff.value.id}?propertyId=${activePropertyId.value}`, {
      method: 'PATCH',
      body: {
        permissions: selectedPermissions.value
      }
    })
    addToast('Berhasil', res.message || 'Hak akses operator berhasil diperbarui', 'success')
    closePermissionModal()
    await fetchStaff()
  } catch (err: any) {
    addToast('Gagal', err.data?.message || err.message || 'Gagal menyimpan hak akses', 'error')
  } finally {
    isSavingPermissions.value = false
  }
}

const getInitials = (name?: string) => {
  if (!name) return 'OP'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

const getActivePermissionsCount = (permissions: string[] = []) => {
  if (!permissions) return 0
  let count = 0
  for (const p of permissions) {
    if (p === 'manage_rooms') count += 4
    else if (p === 'manage_tenants') count += 4
    else if (p === 'manage_payments') count += 4
    else if (p === 'manage_expenses') count += 4
    else if (p === 'view_reports') count += 1
    else count += 1
  }
  return Math.min(count, ALL_PERMISSION_IDS.length)
}
</script>

<template>
  <div v-if="!isOwner" class="text-center py-16 text-surface-500">
    Halaman ini hanya dapat diakses oleh Pemilik Kos (Owner) atau Superadmin.
  </div>
  
  <div v-else class="space-y-6 max-w-7xl mx-auto pb-12">
    <!-- Header Card -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 dark:bg-surface-900/70 backdrop-blur-md p-5 rounded-2xl border border-surface-200/80 dark:border-surface-800 shadow-xs">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
          <PhUsersThree :size="22" weight="bold" />
        </div>
        <div>
          <h1 class="text-xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
            Staf & Operator
          </h1>
          <p class="text-xs text-surface-500 dark:text-surface-400">
            Kelola operator dan tentukan hak akses mikro per modul secara terperinci.
          </p>
        </div>
      </div>
    </div>

    <!-- Active Property Guard Notice -->
    <div v-if="!activePropertyId" class="text-center py-16 bg-white dark:bg-surface-900 rounded-2xl border border-surface-200/80 dark:border-surface-800 shadow-xs p-6">
      <div class="w-12 h-12 mx-auto rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3">
        <PhShieldCheck :size="24" weight="duotone" />
      </div>
      <h2 class="text-lg font-bold text-surface-900 dark:text-surface-100 mb-1">Pilih Properti Aktif</h2>
      <p class="text-xs text-surface-500 dark:text-surface-400 max-w-md mx-auto mb-5">
        Silakan pilih properti kos pada dropdown di bagian atas untuk mengelola staf dan hak akses operator.
      </p>
      <NuxtLink to="/properties" class="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs active:scale-95">
        Pergi ke Menu Properties
      </NuxtLink>
    </div>

    <template v-else>
      <!-- Quick Hire / Invite Card -->
      <div class="bg-white dark:bg-surface-900 rounded-2xl p-5 border border-surface-200/80 dark:border-surface-800 shadow-xs">
        <div class="flex items-center gap-2 mb-2">
          <PhUserPlus :size="18" weight="bold" class="text-brand-600 dark:text-brand-400" />
          <h2 class="text-sm font-bold text-surface-900 dark:text-surface-100">Tambah Operator Baru</h2>
        </div>
        <p class="text-xs text-surface-500 dark:text-surface-400 mb-4">
          Pastikan calon operator telah mendaftar akun di KosManager menggunakan email mereka sebelum ditugaskan pada properti ini.
        </p>
        <form @submit.prevent="inviteOperator" class="flex flex-col sm:flex-row gap-3">
          <input 
            v-model="emailToInvite" 
            type="email" 
            required 
            id="operator-email-input"
            class="flex-1 bg-surface-50 dark:bg-surface-800 border border-surface-300 dark:border-surface-700 text-surface-900 dark:text-surface-100 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all placeholder:text-surface-400" 
            placeholder="Masukkan email calon operator (contoh: budi@gmail.com)" 
          />
          <button 
            type="submit" 
            :disabled="isSubmitting" 
            id="operator-submit-btn"
            class="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl px-5 py-2.5 transition-all shadow-2xs whitespace-nowrap active:scale-95"
          >
            <PhUserPlus :size="15" weight="bold" />
            <span>{{ isSubmitting ? 'Memproses...' : 'Tugaskan Operator' }}</span>
          </button>
        </form>
      </div>

      <!-- Staff List Table Card -->
      <div class="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200/80 dark:border-surface-800 shadow-xs overflow-hidden">
        <!-- Skeleton Loader -->
        <div v-if="isLoading" class="divide-y divide-surface-100 dark:divide-surface-800 p-4 space-y-3">
          <div v-for="i in 3" :key="'skel-' + i" class="p-4 rounded-xl bg-surface-50/60 dark:bg-surface-800/40 animate-pulse flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-surface-200 dark:bg-surface-700"></div>
              <div class="space-y-1.5">
                <div class="h-4 bg-surface-200 dark:bg-surface-700 rounded w-28"></div>
                <div class="h-3 bg-surface-200 dark:bg-surface-700 rounded w-40"></div>
              </div>
            </div>
            <div class="h-8 bg-surface-200 dark:bg-surface-700 rounded w-24"></div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="staffList.length === 0" class="py-16 px-4 text-center">
          <div class="w-12 h-12 mx-auto rounded-2xl bg-surface-100 dark:bg-surface-800 text-surface-400 flex items-center justify-center mb-3">
            <PhUsersThree :size="24" weight="duotone" />
          </div>
          <h3 class="text-sm font-bold text-surface-900 dark:text-surface-100">Belum ada operator</h3>
          <p class="text-xs text-surface-500 dark:text-surface-400 max-w-sm mx-auto mt-1">
            Properti ini belum memiliki operator staf yang ditugaskan. Gunakan formulir di atas untuk menugaskan operator.
          </p>
        </div>

        <!-- Table View -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="text-2xs font-bold uppercase tracking-wider text-surface-500 bg-surface-50/80 dark:bg-surface-800/60 border-b border-surface-200/80 dark:border-surface-800">
              <tr>
                <th scope="col" class="px-5 py-3.5">Operator</th>
                <th scope="col" class="px-5 py-3.5">Email</th>
                <th scope="col" class="px-5 py-3.5">Ditugaskan Sejak</th>
                <th scope="col" class="px-5 py-3.5">Hak Akses Mikro</th>
                <th scope="col" class="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
              <tr 
                v-for="staff in staffList" 
                :key="staff.id" 
                class="hover:bg-surface-50/60 dark:hover:bg-surface-800/40 transition-colors"
              >
                <!-- Name & Avatar -->
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300 flex items-center justify-center font-bold text-xs shadow-2xs">
                      {{ getInitials(staff.name) }}
                    </div>
                    <div>
                      <p class="font-bold text-surface-900 dark:text-surface-100">{{ staff.name || '-' }}</p>
                      <span class="inline-block px-1.5 py-0.5 rounded text-3xs font-semibold uppercase tracking-wider bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300">
                        Operator
                      </span>
                    </div>
                  </div>
                </td>

                <!-- Email -->
                <td class="px-5 py-4 font-mono text-xs text-surface-600 dark:text-surface-300">
                  {{ staff.email }}
                </td>

                <!-- Assigned At -->
                <td class="px-5 py-4 text-surface-500 dark:text-surface-400 tabular-nums">
                  {{ new Date(staff.assignedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}
                </td>

                <!-- Permissions Badge -->
                <td class="px-5 py-4">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-2xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <PhShieldCheck :size="13" weight="bold" />
                    <span class="tabular-nums">{{ getActivePermissionsCount(staff.permissions) }}</span> / {{ ALL_PERMISSION_IDS.length }} Hak Akses
                  </span>
                </td>

                <!-- Action Buttons -->
                <td class="px-5 py-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button 
                      @click="openPermissionModal(staff)" 
                      id="btn-open-permissions"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-300 dark:hover:bg-brand-900/50 border border-brand-200 dark:border-brand-800 transition-all active:scale-95 shadow-2xs"
                    >
                      <PhKey :size="13" weight="bold" />
                      <span>Atur Akses</span>
                    </button>

                    <button 
                      @click="removeOperator(staff.id)" 
                      id="btn-remove-operator"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 transition-all active:scale-95 shadow-2xs"
                    >
                      <PhTrash :size="13" weight="bold" />
                      <span>Cabut</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>

  <!-- Granular Operator Access Rights Modal -->
  <div 
    v-if="isPermissionModalOpen" 
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-surface-950/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto"
  >
    <div 
      class="bg-white dark:bg-surface-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-surface-200/80 dark:border-surface-800 w-full max-w-2xl overflow-hidden mt-auto sm:mt-0 flex flex-col max-h-[90vh]"
    >
      <!-- Modal Header -->
      <div class="px-5 py-4 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between bg-surface-50/70 dark:bg-surface-800/50">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <PhKey :size="18" weight="bold" />
          </div>
          <div>
            <h3 class="text-base font-bold text-surface-900 dark:text-surface-100">
              Hak Akses Mikro Operator
            </h3>
            <p class="text-2xs text-surface-500 dark:text-surface-400">
              Atur izin tindakan untuk <span class="font-bold text-surface-800 dark:text-surface-200">{{ selectedStaff?.name || selectedStaff?.email }}</span>
            </p>
          </div>
        </div>
        <button 
          @click="closePermissionModal" 
          id="btn-close-modal"
          class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-200/60 dark:hover:bg-surface-700/60 transition-all"
        >
          <PhX :size="16" weight="bold" />
        </button>
      </div>

      <!-- Modal Body / Granular Permission Matrix -->
      <div class="p-5 max-h-[65vh] overflow-y-auto scrollbar-thin space-y-4 flex-1">
        <div 
          v-for="module in PERMISSION_MODULES" 
          :key="module.id" 
          class="rounded-2xl border border-surface-200/80 dark:border-surface-800 bg-surface-50/40 dark:bg-surface-800/30 overflow-hidden shadow-2xs"
        >
          <!-- Module Header Bar -->
          <div class="px-4 py-3 bg-white dark:bg-surface-850 border-b border-surface-200/60 dark:border-surface-800 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 flex items-center justify-center">
                <component :is="module.icon" :size="15" weight="duotone" />
              </div>
              <div>
                <h4 class="text-xs font-bold text-surface-900 dark:text-surface-100">{{ module.title }}</h4>
                <p class="text-3xs text-surface-500">{{ module.description }}</p>
              </div>
            </div>

            <!-- Select All Module Toggle Button -->
            <button 
              type="button"
              @click="toggleModuleAll(module)"
              :id="'toggle-all-' + module.id"
              class="inline-flex items-center gap-1 text-2xs font-semibold px-2.5 py-1 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:border-brand-500 hover:text-brand-600 transition-all active:scale-95"
            >
              <component :is="isModuleAllSelected(module) ? PhCheckSquare : PhSquare" :size="13" weight="bold" />
              <span>{{ isModuleAllSelected(module) ? 'Batal Semua' : 'Pilih Semua' }}</span>
            </button>
          </div>

          <!-- Micro-Permissions List within Module -->
          <div class="p-3 flex flex-col gap-2">
            <div 
              v-for="perm in module.permissions" 
              :key="perm.id"
              class="flex items-start justify-between gap-4 p-3 rounded-xl border bg-white dark:bg-surface-900 transition-all"
              :class="[
                selectedPermissions.includes(perm.id) 
                  ? 'border-brand-200 dark:border-brand-900/60 bg-brand-50/30 dark:bg-brand-950/30' 
                  : 'border-surface-200/60 dark:border-surface-800/80 hover:border-surface-300'
              ]"
            >
              <div class="flex-1 space-y-0.5">
                <p class="text-xs font-bold text-surface-900 dark:text-surface-100">{{ perm.label }}</p>
                <p class="text-xs text-surface-500 dark:text-surface-400 leading-relaxed whitespace-normal text-balance">{{ perm.description }}</p>
              </div>

              <!-- Animated Custom Tailwind Toggle Switch -->
              <button
                type="button"
                role="switch"
                :id="'toggle-' + perm.id"
                :aria-checked="selectedPermissions.includes(perm.id)"
                @click="togglePermission(perm.id)"
                class="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 mt-0.5"
                :class="selectedPermissions.includes(perm.id) ? 'bg-brand-600 dark:bg-brand-500' : 'bg-surface-200 dark:bg-surface-700'"
              >
                <span
                  class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  :class="selectedPermissions.includes(perm.id) ? 'translate-x-4' : 'translate-x-0'"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-5 py-3.5 border-t border-surface-100 dark:border-surface-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-50/70 dark:bg-surface-800/50">
        <div class="text-2xs text-surface-500 dark:text-surface-400">
          <span class="font-bold text-surface-900 dark:text-surface-100 tabular-nums">{{ selectedPermissions.length }}</span> dari {{ ALL_PERMISSION_IDS.length }} hak akses aktif
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <button 
            @click="closePermissionModal" 
            type="button" 
            class="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold text-surface-700 dark:text-surface-300 border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 hover:bg-surface-50 dark:hover:bg-surface-700 transition-all shadow-2xs"
          >
            Batal
          </button>
          <button 
            @click="savePermissions" 
            :disabled="isSavingPermissions" 
            id="btn-save-permissions"
            type="button" 
            class="flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-all shadow-2xs flex items-center justify-center gap-1.5 active:scale-95"
          >
            <PhShieldCheck :size="15" weight="bold" />
            <span>{{ isSavingPermissions ? 'Menyimpan...' : 'Simpan Hak Akses' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
