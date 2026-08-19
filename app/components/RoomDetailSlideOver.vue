<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition
      enter-active-class="transition-opacity ease-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div 
        v-if="modelValue" 
        @click="close"
        class="fixed inset-0 z-50 bg-surface-950/50 backdrop-blur-xs"
      />
    </Transition>

    <!-- Slide-over Panel -->
    <Transition
      enter-active-class="transform transition ease-in-out duration-300"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transform transition ease-in-out duration-300"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div 
        v-if="modelValue" 
        id="room-detail-slideover-panel"
        class="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white dark:bg-surface-900 shadow-2xl border-l border-surface-200/80 dark:border-surface-800 flex flex-col overflow-hidden"
      >
        <!-- Header -->
        <div class="px-6 py-5 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between bg-surface-50/60 dark:bg-surface-850">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-base font-outfit flex-shrink-0">
              <PhDoor :size="22" weight="bold" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base font-bold text-surface-900 dark:text-surface-50 font-outfit">
                  {{ roomData ? formatRoomTitle(roomData.roomNumber) : 'Detail Kamar' }}
                </h3>
                <!-- Status Badge -->
                <span 
                  v-if="roomData?.status === 'available'"
                  class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-3xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Tersedia</span>
                </span>
                <span 
                  v-else
                  class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-3xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300 border border-brand-200 dark:border-brand-800"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                  <span>Terisi</span>
                </span>
              </div>
              <p class="text-xs text-surface-500 dark:text-surface-400 font-mono mt-0.5">
                Properti: {{ roomData?.property?.name || 'Properti Aktif' }}
              </p>
            </div>
          </div>
          <button 
            @click="close" 
            id="btn-close-room-detail"
            type="button"
            class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-200/60 dark:hover:bg-surface-700/60 transition-all"
          >
            <PhX :size="16" weight="bold" />
          </button>
        </div>

        <!-- Body / Content -->
        <div class="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
          <div v-if="loading" class="py-12 flex flex-col items-center justify-center text-surface-400 gap-3">
            <PhSpinner :size="28" class="animate-spin text-brand-500" />
            <p class="text-xs">Memuat data kamar...</p>
          </div>

          <template v-else-if="roomData">
            <!-- Pricing & Financial Breakdown Hero Card -->
            <div class="p-5 rounded-2xl bg-surface-50 dark:bg-surface-800/40 border border-surface-200/80 dark:border-surface-700/70 space-y-4 shadow-2xs">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-900/60 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
                    <PhCoins :size="16" weight="bold" />
                  </div>
                  <div>
                    <span class="text-3xs font-bold uppercase tracking-wider text-surface-500 block">Struktur Tarif Bulanan</span>
                    <h4 class="text-xs font-bold text-surface-900 dark:text-surface-100">
                      Rincian Biaya Sewa
                    </h4>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-3xs font-bold uppercase tracking-wider text-surface-500 block">Total Sewa</span>
                  <p class="text-base font-bold text-brand-600 dark:text-brand-400 tabular-nums">
                    Rp {{ formatNumber(totalMonthlyRate) }}
                  </p>
                </div>
              </div>

              <!-- Itemized Breakdown -->
              <div class="space-y-2 pt-3 border-t border-surface-200/60 dark:border-surface-700/60 text-xs">
                <div class="flex items-center justify-between py-1 text-surface-600 dark:text-surface-300">
                  <span>Tarif Pokok Kamar</span>
                  <span class="font-bold tabular-nums text-surface-900 dark:text-surface-100">
                    Rp {{ formatNumber(roomData.monthlyRate || 0) }}
                  </span>
                </div>

                <template v-if="roomData.additionalFees && roomData.additionalFees.length > 0">
                  <div 
                    v-for="(fee, idx) in roomData.additionalFees" 
                    :key="idx"
                    class="flex items-center justify-between py-1 text-surface-500 dark:text-surface-400 text-2xs pl-2 border-l-2 border-brand-300 dark:border-brand-700"
                  >
                    <span>+ {{ fee.name || 'Biaya Fasilitas' }}</span>
                    <span class="font-medium tabular-nums text-surface-800 dark:text-surface-200">
                      Rp {{ formatNumber(fee.amount || 0) }}
                    </span>
                  </div>
                </template>
                <div v-else class="text-3xs text-surface-400 italic py-0.5">
                  Tidak ada biaya berkala tambahan.
                </div>
              </div>
            </div>

            <!-- Current Occupant Card -->
            <div class="p-5 rounded-2xl bg-white dark:bg-surface-850 border border-surface-200/80 dark:border-surface-800 space-y-4 shadow-2xs">
              <h4 class="text-xs font-bold uppercase tracking-wider text-surface-500 flex items-center gap-1.5">
                <PhUser :size="14" weight="bold" />
                <span>Penghuni Saat Ini</span>
              </h4>

              <!-- If Occupied -->
              <div v-if="currentTenant" class="space-y-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 flex items-center justify-center font-bold text-sm">
                      {{ currentTenant.name ? currentTenant.name.charAt(0).toUpperCase() : 'P' }}
                    </div>
                    <div>
                      <h5 class="text-sm font-bold text-surface-900 dark:text-surface-100">
                        {{ currentTenant.name }}
                      </h5>
                      <p class="text-2xs text-surface-500 font-mono">
                        {{ currentTenant.phone || 'No. Telp tidak ada' }}
                      </p>
                    </div>
                  </div>

                  <a 
                    v-if="tenantWhatsappUrl"
                    :href="tenantWhatsappUrl"
                    target="_blank"
                    class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all shadow-2xs"
                  >
                    <PhWhatsappLogo :size="14" weight="bold" />
                    <span>Chat WA</span>
                  </a>
                </div>

                <div class="grid grid-cols-2 gap-3 pt-3 border-t border-surface-100 dark:border-surface-800 text-2xs text-surface-600 dark:text-surface-400">
                  <div>
                    <span class="block text-surface-400 font-medium">Tanggal Check-In</span>
                    <span class="font-bold text-surface-900 dark:text-surface-100">
                      {{ formatDate(currentTenant.checkIn) }}
                    </span>
                  </div>
                  <div>
                    <span class="block text-surface-400 font-medium">Kontak Darurat</span>
                    <span class="font-bold text-surface-900 dark:text-surface-100 truncate block">
                      {{ currentTenant.emergencyContact || '-' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- If Vacant -->
              <div v-else class="p-6 rounded-xl bg-surface-50/70 dark:bg-surface-800/30 border border-dashed border-surface-200 dark:border-surface-700 flex flex-col items-center justify-center text-center gap-2">
                <div class="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <PhCheckCircle :size="20" weight="bold" />
                </div>
                <div>
                  <p class="text-xs font-bold text-surface-800 dark:text-surface-200">Kamar Kosong / Tersedia</p>
                  <p class="text-3xs text-surface-400 mt-0.5">Kamar ini siap dihuni dan dapat dipilih pada pendaftaran penghuni baru.</p>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Footer / Action Area -->
        <div class="p-5 border-t border-surface-100 dark:border-surface-800 bg-surface-50/60 dark:bg-surface-850 flex items-center justify-between gap-2.5">
          <button 
            @click="close" 
            type="button" 
            class="px-4 py-2.5 rounded-xl text-xs font-semibold text-surface-700 dark:text-surface-300 border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 hover:bg-surface-50 transition-all shadow-2xs min-h-[44px]"
          >
            Tutup
          </button>

          <div class="flex items-center gap-2">
            <!-- Edit Button -->
            <button 
              @click="handleEdit" 
              id="btn-room-detail-edit"
              type="button" 
              class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-surface-700 dark:text-surface-200 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 hover:bg-surface-50 transition-all shadow-2xs min-h-[44px]"
            >
              <PhPencilSimple :size="14" weight="bold" />
              <span>Edit Kamar</span>
            </button>

            <!-- Delete Button -->
            <button 
              @click="handleDelete" 
              id="btn-room-detail-delete"
              type="button" 
              class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-2xs active:scale-95 min-h-[44px]"
            >
              <PhTrash :size="14" weight="bold" />
              <span>Hapus</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  PhX, 
  PhDoor, 
  PhCoins, 
  PhUser, 
  PhPencilSimple, 
  PhTrash, 
  PhWhatsappLogo, 
  PhCheckCircle, 
  PhSpinner 
} from '@phosphor-icons/vue'
import { useConfirm } from '~/composables/useConfirm'

const props = defineProps<{
  modelValue: boolean
  room: any | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'edit', room: any): void
  (e: 'deleted'): void
}>()

const { addToast } = useToast()
const { confirm } = useConfirm()

const loading = ref(false)
const roomData = computed(() => props.room)

const currentTenant = computed(() => {
  if (roomData.value?.tenants && roomData.value.tenants.length > 0) {
    return roomData.value.tenants[0]
  }
  return null
})

const tenantWhatsappUrl = computed(() => {
  if (!currentTenant.value?.phone) return null
  const cleaned = currentTenant.value.phone.replace(/[^0-9]/g, '')
  const formatted = cleaned.startsWith('0') ? '62' + cleaned.slice(1) : cleaned
  return `https://wa.me/${formatted}`
})

const totalMonthlyRate = computed(() => {
  if (!roomData.value) return 0
  const base = Number(roomData.value.monthlyRate) || 0
  const fees = (roomData.value.additionalFees || []).reduce((sum: number, fee: any) => sum + (Number(fee.amount) || 0), 0)
  return base + fees
})

const formatRoomTitle = (roomNumber?: string) => {
  if (!roomNumber) return 'Detail Kamar'
  return roomNumber.toLowerCase().startsWith('kamar') ? roomNumber : `Kamar ${roomNumber}`
}

const formatNumber = (val: any) => {
  const num = Number(val)
  if (isNaN(num)) return '0'
  return num.toLocaleString('id-ID')
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(dateString))
}

const close = () => {
  emit('update:modelValue', false)
}

const handleEdit = () => {
  if (roomData.value) {
    emit('edit', roomData.value)
    close()
  }
}

const handleDelete = async () => {
  if (!roomData.value?.id) return

  const isConfirmed = await confirm({
    title: 'Hapus Kamar',
    message: `Apakah Anda yakin ingin menghapus kamar ${roomData.value.roomNumber}? Tindakan ini tidak dapat dibatalkan.`,
    confirmText: 'Ya, Hapus',
    cancelText: 'Batal',
    type: 'danger'
  })

  if (!isConfirmed) return

  try {
    await $fetch(`/api/rooms/${roomData.value.id}`, {
      method: 'DELETE'
    })
    addToast('Berhasil', 'Kamar berhasil dihapus.', 'success')
    emit('deleted')
    close()
  } catch (err: any) {
    addToast('Gagal Menghapus', err.data?.statusMessage || 'Gagal menghapus data kamar.', 'error')
  }
}
</script>
