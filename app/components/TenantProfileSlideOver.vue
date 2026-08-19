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
        id="tenant-profile-slideover-panel"
        class="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white dark:bg-surface-900 shadow-2xl border-l border-surface-200/80 dark:border-surface-800 flex flex-col overflow-hidden"
      >
        <!-- Header -->
        <div class="px-6 py-5 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between bg-surface-50/60 dark:bg-surface-850">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-base font-outfit flex-shrink-0">
              {{ profileData?.name ? profileData.name.charAt(0).toUpperCase() : 'T' }}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base font-bold text-surface-900 dark:text-surface-50 font-outfit">
                  {{ profileData?.name || 'Profil Penghuni' }}
                </h3>
                <!-- Status Dot Badge -->
                <span 
                  v-if="profileData?.isActive === 1"
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
              </div>
              <p class="text-xs text-surface-500 dark:text-surface-400 font-mono mt-0.5">
                ID: {{ profileData?.id ? profileData.id.slice(0, 8).toUpperCase() : '-' }}
              </p>
            </div>
          </div>
          <button 
            @click="close" 
            id="btn-close-tenant-profile"
            class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-200/60 dark:hover:bg-surface-700/60 transition-all"
          >
            <PhX :size="16" weight="bold" />
          </button>
        </div>

        <!-- Body / Content -->
        <div class="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
          <div v-if="loading" class="py-12 flex flex-col items-center justify-center text-surface-400 gap-3">
            <PhSpinner :size="28" class="animate-spin text-brand-500" />
            <p class="text-xs">Memuat profil 360 penghuni...</p>
          </div>

          <template v-else-if="profileData">
            <!-- Financial Standing & Tunggakan Hero Card -->
            <div class="p-4 rounded-2xl border space-y-3 shadow-2xs"
              :class="financialData.totalArrears > 0 
                ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-800/60' 
                : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/60'"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div 
                    class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    :class="financialData.totalArrears > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'"
                  >
                    <PhCoins :size="16" weight="bold" />
                  </div>
                  <div>
                    <span class="text-3xs font-bold uppercase tracking-wider text-surface-500 block">Status Keuangan</span>
                    <h4 class="text-xs font-bold" :class="financialData.totalArrears > 0 ? 'text-rose-700' : 'text-emerald-700'">
                      {{ financialData.totalArrears > 0 ? 'Terdapat Tunggakan Pembayaran' : 'Seluruh Tagihan Lunas' }}
                    </h4>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-3xs font-bold uppercase tracking-wider text-surface-500 block">Total Tunggakan</span>
                  <p class="text-sm font-bold tabular-nums" :class="financialData.totalArrears > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'">
                    Rp {{ formatNumber(financialData.totalArrears) }}
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2 pt-2 border-t border-surface-200/50 text-2xs text-surface-600">
                <div>
                  <span class="text-surface-400">Tagihan Belum Lunas:</span>
                  <span class="font-bold text-surface-900 ml-1">{{ financialData.unpaidInvoicesCount }} Bulan</span>
                </div>
                <div class="text-right">
                  <span class="text-surface-400">Total Tagihan Terbit:</span>
                  <span class="font-bold text-surface-900 ml-1">{{ financialData.totalInvoicesCount }} Invoice</span>
                </div>
              </div>
            </div>

            <!-- Demographics & Personal Info Card -->
            <div class="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/40 border border-surface-200/70 dark:border-surface-700/60 space-y-3">
              <h4 class="text-xs font-bold uppercase tracking-wider text-surface-500 flex items-center gap-1.5">
                <PhUser :size="14" weight="bold" />
                <span>Identitas & Domisili</span>
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div>
                  <span class="text-3xs text-surface-400 uppercase font-bold tracking-wider block">No. Telepon / WhatsApp</span>
                  <span class="font-semibold text-surface-800 dark:text-surface-200 tabular-nums">
                    {{ profileData.phone || 'Tidak dicatat' }}
                  </span>
                </div>
                <div>
                  <span class="text-3xs text-surface-400 uppercase font-bold tracking-wider block">Kontak Darurat</span>
                  <span class="font-semibold text-surface-800 dark:text-surface-200">
                    {{ profileData.emergencyContact || 'Tidak dicatat' }}
                  </span>
                </div>
                <div class="sm:col-span-2">
                  <span class="text-3xs text-surface-400 uppercase font-bold tracking-wider block">Domisili Asal (Kemendagri)</span>
                  <div class="flex items-start gap-1.5 mt-0.5">
                    <PhMapPin :size="14" class="text-brand-500 mt-0.5 flex-shrink-0" />
                    <span class="font-medium text-surface-700 dark:text-surface-300">
                      {{ profileData.location?.formattedAddress || '-' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Room & Contract Details Card -->
            <div class="p-4 rounded-2xl bg-white dark:bg-surface-850 border border-surface-200/80 dark:border-surface-800 space-y-3 shadow-2xs">
              <h4 class="text-xs font-bold uppercase tracking-wider text-surface-500 flex items-center gap-1.5">
                <PhDoor :size="14" weight="bold" />
                <span>Penempatan Kamar & Kontrak</span>
              </h4>

              <div class="grid grid-cols-2 gap-3.5 text-xs">
                <div>
                  <span class="text-3xs text-surface-400 uppercase font-bold tracking-wider block">Kamar</span>
                  <span class="font-bold text-surface-900 dark:text-surface-100">
                    {{ formatRoomName(profileData.room?.roomNumber) }}
                  </span>
                </div>
                <div>
                  <span class="text-3xs text-surface-400 uppercase font-bold tracking-wider block">Tarif Sewa Pokok</span>
                  <span class="font-bold text-surface-900 dark:text-surface-100 tabular-nums">
                    Rp {{ formatNumber(profileData.room?.monthlyRate || 0) }} / bln
                  </span>
                </div>
                <div>
                  <span class="text-3xs text-surface-400 uppercase font-bold tracking-wider block">Tanggal Check-In</span>
                  <span class="font-medium text-surface-700 dark:text-surface-300">
                    {{ formatDate(profileData.checkIn) }}
                  </span>
                </div>
                <div>
                  <span class="text-3xs text-surface-400 uppercase font-bold tracking-wider block">Tanggal Check-Out</span>
                  <span class="font-medium text-surface-700 dark:text-surface-300">
                    {{ profileData.checkOut ? formatDate(profileData.checkOut) : 'Masih Menghuni' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Recent Invoices & Payment Ledger -->
            <div class="space-y-3">
              <h4 class="text-xs font-bold uppercase tracking-wider text-surface-500 flex items-center gap-1.5">
                <PhReceipt :size="14" weight="bold" />
                <span>Riwayat Tagihan & Pembayaran</span>
              </h4>

              <div v-if="!financialData.recentPayments || financialData.recentPayments.length === 0" class="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-dashed border-surface-200 dark:border-surface-700 text-center">
                <p class="text-2xs text-surface-400">Belum ada data tagihan yang diterbitkan untuk penghuni ini.</p>
              </div>

              <div v-else class="space-y-2">
                <div 
                  v-for="inv in financialData.recentPayments" 
                  :key="inv.id"
                  class="p-3.5 rounded-xl border border-surface-200/80 dark:border-surface-800 bg-white dark:bg-surface-850 flex items-center justify-between gap-3 shadow-2xs text-xs"
                >
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-surface-900 dark:text-surface-100">
                        {{ formatBillingMonth(inv.billingMonth) }}
                      </span>
                      <span 
                        v-if="inv.status === 'paid'"
                        class="px-2 py-0.5 rounded text-3xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                      >
                        Lunas
                      </span>
                      <span 
                        v-else-if="inv.status === 'partial'"
                        class="px-2 py-0.5 rounded text-3xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"
                      >
                        Cicilan
                      </span>
                      <span 
                        v-else
                        class="px-2 py-0.5 rounded text-3xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"
                      >
                        Belum Lunas
                      </span>
                    </div>
                    <p class="text-3xs text-surface-400 font-mono mt-0.5">
                      INV-{{ inv.id.slice(0, 8).toUpperCase() }} • Terbayar Rp {{ formatNumber(inv.amountPaid) }} / Rp {{ formatNumber(inv.totalAmount) }}
                    </p>
                  </div>
                  <span class="font-bold text-surface-900 tabular-nums">
                    Rp {{ formatNumber(inv.totalAmount) }}
                  </span>
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
            class="px-4 py-2.5 rounded-xl text-xs font-semibold text-surface-700 dark:text-surface-300 border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 hover:bg-surface-50 transition-all shadow-2xs"
          >
            Tutup
          </button>

          <div class="flex items-center gap-2">
            <!-- WhatsApp Contact Link -->
            <a 
              v-if="whatsappUrl"
              :href="whatsappUrl" 
              target="_blank" 
              class="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all shadow-2xs"
            >
              <PhWhatsappLogo :size="15" weight="bold" />
              <span>WhatsApp</span>
            </a>

            <!-- Edit Button -->
            <button 
              @click="handleEdit" 
              id="btn-profile-edit"
              type="button" 
              class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-surface-700 bg-white border border-surface-300 hover:bg-surface-50 transition-all shadow-2xs"
            >
              <PhPencilSimple :size="14" weight="bold" />
              <span>Edit</span>
            </button>

            <!-- Checkout Button -->
            <button 
              v-if="profileData?.isActive === 1"
              @click="handleCheckout" 
              id="btn-profile-checkout"
              type="button" 
              class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-all shadow-2xs active:scale-95"
            >
              <PhSignOut :size="14" weight="bold" />
              <span>Check Out</span>
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
  PhUser, 
  PhMapPin, 
  PhDoor, 
  PhCoins, 
  PhReceipt, 
  PhSpinner, 
  PhWhatsappLogo, 
  PhPencilSimple, 
  PhSignOut 
} from '@phosphor-icons/vue'

const props = defineProps<{
  modelValue: boolean
  tenantId: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'edit', tenant: any): void
  (e: 'checkout', tenantId: string): void
}>()

const loading = ref(false)
const profileData = ref<any>(null)

const financialData = computed(() => {
  return profileData.value?.financial || {
    totalArrears: 0,
    unpaidInvoicesCount: 0,
    totalInvoicesCount: 0,
    recentPayments: []
  }
})

const whatsappUrl = computed(() => {
  if (!profileData.value?.phone) return null
  const cleaned = profileData.value.phone.replace(/[^0-9]/g, '')
  const formatted = cleaned.startsWith('0') ? '62' + cleaned.slice(1) : cleaned
  return `https://wa.me/${formatted}`
})

const fetchTenantProfile = async (id: string) => {
  loading.value = true
  try {
    const res: any = await $fetch(`/api/tenants/${id}`)
    if (res.status === 'success') {
      profileData.value = res.data
    }
  } catch (err) {
    console.error('Failed to fetch tenant 360 profile', err)
  } finally {
    loading.value = false
  }
}

watch(() => props.tenantId, (newId) => {
  if (newId && props.modelValue) {
    fetchTenantProfile(newId)
  }
})

watch(() => props.modelValue, (isOpen) => {
  if (isOpen && props.tenantId) {
    fetchTenantProfile(props.tenantId)
  } else if (!isOpen) {
    profileData.value = null
  }
})

const close = () => {
  emit('update:modelValue', false)
}

const handleEdit = () => {
  if (profileData.value) {
    emit('edit', profileData.value)
    close()
  }
}

const handleCheckout = () => {
  if (profileData.value?.id) {
    emit('checkout', profileData.value.id)
    close()
  }
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

const formatBillingMonth = (monthString?: string) => {
  if (!monthString) return '-'
  try {
    const [year, month] = monthString.split('-')
    if (year && month) {
      const date = new Date(parseInt(year), parseInt(month) - 1, 1)
      return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date)
    }
  } catch (e) {
    // fallback
  }
  return monthString
}

const formatRoomName = (roomNumber?: string) => {
  if (!roomNumber) return '-'
  return roomNumber.toLowerCase().startsWith('kamar') ? roomNumber : `Kamar ${roomNumber}`
}
</script>
