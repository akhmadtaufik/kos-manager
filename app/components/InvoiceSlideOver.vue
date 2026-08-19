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

    <!-- Slide-over Off-canvas Panel -->
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
        id="invoice-slideover-panel"
        class="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white dark:bg-surface-900 shadow-2xl border-l border-surface-200/80 dark:border-surface-800 flex flex-col overflow-hidden"
      >
        <!-- Header -->
        <div class="px-6 py-5 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between bg-surface-50/60 dark:bg-surface-850">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
              <PhReceipt :size="20" weight="bold" />
            </div>
            <div>
              <h3 class="text-base font-bold text-surface-900 dark:text-surface-50">
                Rincian Tagihan Sewa
              </h3>
              <p class="text-xs text-surface-500 dark:text-surface-400 font-mono">
                INV-{{ payment?.id ? payment.id.slice(0, 8).toUpperCase() : 'PENDING' }}
              </p>
            </div>
          </div>
          <button 
            @click="close" 
            id="btn-close-slideover"
            class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-200/60 dark:hover:bg-surface-700/60 transition-all"
          >
            <PhX :size="16" weight="bold" />
          </button>
        </div>

        <!-- Body / Content -->
        <div class="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
          <!-- Tenant & Property Info Card -->
          <div class="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200/70 dark:border-surface-700/60 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-bold text-surface-900 dark:text-surface-100">
                  {{ payment?.tenant?.name || 'Penghuni' }}
                </p>
                <p class="text-3xs text-surface-500 font-mono">
                  {{ payment?.tenant?.phone || 'Tanpa No. Telepon' }}
                </p>
              </div>
              <!-- Status Badge -->
              <div>
                <span 
                  v-if="payment?.status === 'paid'"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-2xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Lunas</span>
                </span>
                <span 
                  v-else
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-2xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                  <span>Belum Lunas</span>
                </span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 pt-2 border-t border-surface-200/60 dark:border-surface-700/60 text-xs">
              <div>
                <span class="text-3xs text-surface-400 uppercase font-bold tracking-wider block">Kamar</span>
                <span class="font-semibold text-surface-800 dark:text-surface-200">
                  Kamar {{ payment?.tenant?.room?.roomNumber || '-' }}
                </span>
              </div>
              <div>
                <span class="text-3xs text-surface-400 uppercase font-bold tracking-wider block">Bulan Tagihan</span>
                <span class="font-semibold text-surface-800 dark:text-surface-200">
                  {{ formatBillingMonth(payment?.billingMonth) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Itemized Line Items Breakdown -->
          <div class="space-y-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">
              Rincian Biaya (Line Items)
            </h4>

            <div class="rounded-2xl border border-surface-200/80 dark:border-surface-800 bg-white dark:bg-surface-850 overflow-hidden shadow-2xs">
              <div class="divide-y divide-surface-100 dark:divide-surface-800">
                <!-- Base Rent Row -->
                <div class="p-3.5 flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
                      <PhDoor :size="14" weight="bold" />
                    </div>
                    <div>
                      <p class="font-bold text-surface-900 dark:text-surface-100">Biaya Sewa Dasar</p>
                      <p class="text-3xs text-surface-400">Tarif reguler bulanan kamar</p>
                    </div>
                  </div>
                  <span class="font-bold text-surface-900 dark:text-surface-100 tabular-nums">
                    Rp {{ formatNumber(payment?.baseRent) }}
                  </span>
                </div>

                <!-- Dynamic Additional Fees Rows -->
                <template v-if="additionalFeesList.length > 0">
                  <div 
                    v-for="(fee, idx) in additionalFeesList" 
                    :key="'fee-' + idx"
                    class="p-3.5 flex items-center justify-between text-xs bg-surface-50/40 dark:bg-surface-800/20"
                  >
                    <div class="flex items-center gap-2.5">
                      <div class="w-7 h-7 rounded-lg bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300 flex items-center justify-center flex-shrink-0">
                        <PhPlus :size="13" weight="bold" />
                      </div>
                      <div>
                        <p class="font-semibold text-surface-800 dark:text-surface-200">
                          Biaya Tambahan: {{ fee.name }}
                        </p>
                        <p class="text-3xs text-surface-400">Fasilitas / add-on kamar</p>
                      </div>
                    </div>
                    <span class="font-semibold text-surface-800 dark:text-surface-200 tabular-nums">
                      Rp {{ formatNumber(fee.amount) }}
                    </span>
                  </div>
                </template>
              </div>

              <!-- Grand Total Summary Box -->
              <div class="p-4 bg-surface-50 dark:bg-surface-800/60 border-t-2 border-surface-200 dark:border-surface-700 flex items-center justify-between">
                <div>
                  <span class="text-2xs font-bold uppercase tracking-wider text-surface-500 block">Total Tagihan</span>
                  <span class="text-3xs text-surface-400">Termasuk seluruh biaya sewa & add-on</span>
                </div>
                <span class="text-lg font-bold text-brand-600 dark:text-brand-400 tabular-nums">
                  Rp {{ formatNumber(payment?.totalAmount) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Payment Receipt Timestamp Info if Paid -->
          <div 
            v-if="payment?.status === 'paid' && payment?.paidAt"
            class="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300"
          >
            <PhCheckCircle :size="18" weight="bold" class="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div>
              <p class="font-bold">Pembayaran Telah Diverifikasi</p>
              <p class="text-3xs text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                Dilunasi pada {{ formatFullDate(payment.paidAt) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Footer / Action Area -->
        <div class="p-5 border-t border-surface-100 dark:border-surface-800 bg-surface-50/60 dark:bg-surface-850 flex items-center justify-between gap-3">
          <button 
            @click="close" 
            type="button" 
            class="px-4 py-2.5 rounded-xl text-xs font-semibold text-surface-700 dark:text-surface-300 border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 hover:bg-surface-50 dark:hover:bg-surface-700 transition-all shadow-2xs"
          >
            Tutup
          </button>

          <!-- Pinned Mark as Paid Action Button -->
          <button 
            v-if="payment?.status !== 'paid'"
            @click="handleMarkAsPaid"
            id="btn-slideover-mark-paid"
            type="button"
            class="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-all shadow-2xs active:scale-95 whitespace-nowrap"
          >
            <PhCheckCircle :size="15" weight="bold" />
            <span>Tandai Sebagai Lunas</span>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  PhReceipt, 
  PhX, 
  PhDoor, 
  PhPlus, 
  PhCheckCircle 
} from '@phosphor-icons/vue'

const props = defineProps<{
  modelValue: boolean
  payment: any | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'markedPaid', id: string): void
}>()

const close = () => {
  emit('update:modelValue', false)
}

const additionalFeesList = computed(() => {
  if (!props.payment || !props.payment.additionalFees) return []
  if (Array.isArray(props.payment.additionalFees)) {
    return props.payment.additionalFees
  }
  return []
})

const handleMarkAsPaid = () => {
  if (!props.payment?.id) return
  emit('markedPaid', props.payment.id)
}

const formatNumber = (val: any) => {
  const num = Number(val)
  if (isNaN(num)) return '0'
  return num.toLocaleString('id-ID')
}

const formatFullDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
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
</script>
