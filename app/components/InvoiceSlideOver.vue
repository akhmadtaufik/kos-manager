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
                  v-else-if="payment?.status === 'partial'"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-2xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>Bayar Sebagian</span>
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

          <!-- Payment Progress & Balance Card -->
          <div class="p-4 rounded-2xl bg-white dark:bg-surface-850 border border-surface-200/80 dark:border-surface-800 space-y-3 shadow-2xs">
            <div class="flex items-center justify-between text-xs">
              <div>
                <span class="text-3xs font-bold uppercase tracking-wider text-surface-400 block">Status Pembayaran</span>
                <p class="font-bold text-surface-900 dark:text-surface-100 tabular-nums">
                  Rp {{ formatNumber(payment?.amountPaid || 0) }} <span class="text-surface-400 font-normal">/ Rp {{ formatNumber(totalAmountNum) }}</span>
                </p>
              </div>
              <div class="text-right">
                <span class="text-3xs font-bold uppercase tracking-wider text-surface-400 block">Sisa Tagihan</span>
                <p class="font-bold tabular-nums" :class="remainingBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'">
                  Rp {{ formatNumber(remainingBalance) }}
                </p>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="w-full h-2.5 rounded-full bg-surface-100 dark:bg-surface-700 overflow-hidden">
              <div 
                class="h-full rounded-full transition-all duration-500 ease-out"
                :class="payment?.status === 'paid' ? 'bg-emerald-500' : (payment?.status === 'partial' ? 'bg-amber-500' : 'bg-rose-500')"
                :style="{ width: `${progressPercentage}%` }"
              />
            </div>
            <div class="flex justify-between items-center text-3xs text-surface-400 font-semibold tabular-nums">
              <span>{{ progressPercentage }}% Terbayar</span>
              <span v-if="payment?.status === 'paid'">Lunas Sepenuhnya</span>
              <span v-else-if="payment?.status === 'partial'">Belum Selesai (Cicilan)</span>
              <span v-else>Belum Ada Pembayaran</span>
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

                <!-- Tunggakan Arrears Row -->
                <div v-if="previousArrearsNum > 0" class="p-3.5 flex items-center justify-between text-xs bg-rose-50/40 dark:bg-rose-900/10">
                  <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                      <PhClockCounterClockwise :size="13" weight="bold" />
                    </div>
                    <div>
                      <p class="font-bold text-rose-700 dark:text-rose-300">
                        Tunggakan Bulan Sebelumnya
                      </p>
                      <p class="text-3xs text-rose-500/70 dark:text-rose-400/70">Sisa tagihan yang belum lunas</p>
                    </div>
                  </div>
                  <span class="font-bold text-rose-700 dark:text-rose-300 tabular-nums">
                    Rp {{ formatNumber(previousArrearsNum) }}
                  </span>
                </div>
              </div>

              <!-- Grand Total Summary Box -->
              <div class="p-4 bg-surface-50 dark:bg-surface-800/60 border-t-2 border-surface-200 dark:border-surface-700 flex items-center justify-between">
                <div>
                  <span class="text-2xs font-bold uppercase tracking-wider text-surface-500 block">Total Tagihan</span>
                  <span class="text-3xs text-surface-400">Termasuk tunggakan (jika ada)</span>
                </div>
                <span class="text-lg font-bold text-brand-600 dark:text-brand-400 tabular-nums">
                  Rp {{ formatNumber(totalAmountNum) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Payment History Timeline (Ledger) -->
          <div class="space-y-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 flex items-center gap-1.5">
              <PhClockCounterClockwise :size="14" weight="bold" />
              <span>Riwayat Pembayaran (Ledger)</span>
            </h4>

            <div v-if="transactionsList.length === 0" class="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-dashed border-surface-200 dark:border-surface-700 text-center">
              <p class="text-2xs text-surface-400">Belum ada transaksi pembayaran yang dicatat.</p>
            </div>

            <div v-else class="space-y-2">
              <div 
                v-for="txn in transactionsList" 
                :key="txn.id"
                class="p-3.5 rounded-xl border border-surface-200/80 dark:border-surface-800 bg-white dark:bg-surface-850 flex items-start justify-between gap-3 shadow-2xs"
              >
                <div class="flex items-start gap-2.5">
                  <div class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <PhCheckCircle :size="14" weight="bold" />
                  </div>
                  <div>
                    <p class="text-xs font-bold text-surface-900 dark:text-surface-100 tabular-nums">
                      Rp {{ formatNumber(txn.amount) }}
                    </p>
                    <p class="text-3xs text-surface-500">
                      {{ txn.notes || 'Pembayaran cicilan / tunai' }}
                    </p>
                    <span class="text-3xs text-surface-400 font-mono block mt-0.5">
                      Dicatat oleh: {{ txn.recorder?.name || txn.recorder?.email || 'Operator' }}
                    </span>
                  </div>
                </div>
                <span class="text-3xs text-surface-400 font-medium tabular-nums whitespace-nowrap">
                  {{ formatFullDate(txn.paymentDate || txn.createdAt) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer / Action Area -->
        <div class="p-5 border-t border-surface-100 dark:border-surface-800 bg-surface-50/60 dark:bg-surface-850 flex flex-wrap items-center justify-between gap-2.5">
          <button 
            @click="close" 
            type="button" 
            class="px-4 py-2 rounded-xl text-xs font-semibold text-surface-700 dark:text-surface-300 border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 hover:bg-surface-50 dark:hover:bg-surface-700 transition-all shadow-2xs"
          >
            Tutup
          </button>

          <!-- Action Buttons when not fully paid -->
          <div v-if="payment?.status !== 'paid'" class="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
            <!-- Bayar Sebagian (Cicilan) Button -->
            <button 
              @click="openPartialModal"
              id="btn-slideover-partial-pay"
              type="button"
              class="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/40 dark:hover:bg-brand-900/50 border border-brand-200 dark:border-brand-800 transition-all shadow-2xs active:scale-95 whitespace-nowrap"
            >
              <PhCoins :size="14" weight="bold" />
              <span>Bayar Sebagian</span>
            </button>

            <!-- Pelunasan Penuh Button -->
            <button 
              @click="handleMarkAsPaid"
              id="btn-slideover-mark-paid"
              type="button"
              class="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-all shadow-2xs active:scale-95 whitespace-nowrap"
            >
              <PhCheckCircle :size="14" weight="bold" />
              <span>Pelunasan Penuh</span>
            </button>
          </div>
          <div v-else class="text-3xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5">
            <PhCheckCircle :size="13" weight="bold" />
            <span>Terverifikasi Lunas</span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Partial Payment Modal Dialog -->
    <div 
      v-if="isPartialModalOpen" 
      class="fixed inset-0 z-[60] flex items-center justify-center bg-surface-950/60 backdrop-blur-xs p-4"
    >
      <div class="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-surface-200/80 dark:border-surface-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <!-- Modal Header -->
        <div class="px-5 py-4 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between bg-surface-50/70 dark:bg-surface-800/50">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <PhCoins :size="18" weight="bold" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-surface-900 dark:text-surface-100">
                Catat Pembayaran Sebagian
              </h3>
              <p class="text-3xs text-surface-500">
                Kamar {{ payment?.tenant?.room?.roomNumber }} — {{ payment?.tenant?.name }}
              </p>
            </div>
          </div>
          <button 
            @click="isPartialModalOpen = false" 
            class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 w-7 h-7 rounded-lg flex items-center justify-center"
          >
            <PhX :size="15" weight="bold" />
          </button>
        </div>

        <!-- Modal Body -->
        <form @submit.prevent="submitPartialPayment" class="p-5 space-y-4">
          <!-- Balance Summary Banner -->
          <div class="p-3 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-200/70 dark:border-surface-700/60 flex items-center justify-between text-xs">
            <div>
              <span class="text-3xs text-surface-400 block">Sisa Tagihan Saat Ini</span>
              <span class="font-bold text-surface-900 dark:text-surface-100 tabular-nums">
                Rp {{ formatNumber(remainingBalance) }}
              </span>
            </div>
            <div class="text-right">
              <span class="text-3xs text-surface-400 block">Sisa Setelah Pembayaran</span>
              <span 
                class="font-bold tabular-nums"
                :class="remainingAfterPayment < 0 ? 'text-rose-600' : 'text-emerald-600'"
              >
                Rp {{ formatNumber(Math.max(0, remainingAfterPayment)) }}
              </span>
            </div>
          </div>

          <!-- Amount Input -->
          <div class="space-y-1.5">
            <label class="block text-2xs font-bold text-surface-700 dark:text-surface-300">
              Nominal Pembayaran (Rp)
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-surface-400">Rp</span>
              <input 
                v-model.number="partialAmount"
                id="input-partial-amount"
                type="number" 
                min="1" 
                :max="remainingBalance"
                required
                placeholder="Contoh: 500000"
                class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 text-xs font-bold text-surface-900 dark:text-surface-100 tabular-nums focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
              />
            </div>
            <p v-if="partialAmount > remainingBalance" class="text-3xs text-rose-600 font-semibold mt-1">
              Nominal melebihi sisa tagihan (Rp {{ formatNumber(remainingBalance) }})
            </p>
          </div>

          <!-- Notes Input -->
          <div class="space-y-1.5">
            <label class="block text-2xs font-bold text-surface-700 dark:text-surface-300">
              Catatan Pembayaran (Opsional)
            </label>
            <input 
              v-model="partialNotes"
              id="input-partial-notes"
              type="text" 
              placeholder="Contoh: Transfer Bank BCA / Tunai cicilan 1"
              class="w-full px-3.5 py-2.5 rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 text-xs text-surface-900 dark:text-surface-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
            />
          </div>

          <!-- Modal Actions -->
          <div class="flex items-center justify-end gap-2 pt-2 border-t border-surface-100 dark:border-surface-800">
            <button 
              @click="isPartialModalOpen = false" 
              id="btn-cancel-partial-modal"
              type="button" 
              class="px-4 py-2 rounded-xl text-xs font-semibold text-surface-700 dark:text-surface-300 border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 hover:bg-surface-50 transition-all shadow-2xs"
            >
              Batal
            </button>
            <button 
              :disabled="submitting || partialAmount <= 0 || partialAmount > remainingBalance"
              id="btn-submit-partial-pay"
              type="submit" 
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-all shadow-2xs active:scale-95"
            >
              <PhCheckCircle :size="14" weight="bold" />
              <span>{{ submitting ? 'Menyimpan...' : 'Simpan Pembayaran' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  PhReceipt, 
  PhX, 
  PhDoor, 
  PhPlus, 
  PhCheckCircle, 
  PhClockCounterClockwise, 
  PhCoins 
} from '@phosphor-icons/vue'

const props = defineProps<{
  modelValue: boolean
  payment: any | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'markedPaid', id: string): void
  (e: 'transactionRecorded', paymentId: string): void
}>()

const { addToast } = useToast()

const isPartialModalOpen = ref(false)
const partialAmount = ref<number>(0)
const partialNotes = ref<string>('')
const submitting = ref(false)

const close = () => {
  emit('update:modelValue', false)
}

const totalAmountNum = computed(() => {
  return Number(props.payment?.grandTotal ?? props.payment?.totalAmount) || 0
})

const previousArrearsNum = computed(() => {
  return Number(props.payment?.previousArrears) || 0
})

const amountPaidNum = computed(() => {
  return Number(props.payment?.amountPaid) || 0
})

const remainingBalance = computed(() => {
  return Math.max(0, totalAmountNum.value - amountPaidNum.value)
})

const progressPercentage = computed(() => {
  if (totalAmountNum.value <= 0) return 0
  const pct = Math.round((amountPaidNum.value / totalAmountNum.value) * 100)
  return Math.min(100, Math.max(0, pct))
})

const remainingAfterPayment = computed(() => {
  return remainingBalance.value - (partialAmount.value || 0)
})

const additionalFeesList = computed(() => {
  if (!props.payment || !props.payment.additionalFees) return []
  if (Array.isArray(props.payment.additionalFees)) {
    return props.payment.additionalFees
  }
  return []
})

const transactionsList = computed(() => {
  if (!props.payment || !props.payment.transactions) return []
  if (Array.isArray(props.payment.transactions)) {
    return props.payment.transactions
  }
  return []
})

const openPartialModal = () => {
  partialAmount.value = remainingBalance.value
  partialNotes.value = ''
  isPartialModalOpen.value = true
}

const submitPartialPayment = async () => {
  if (!props.payment?.id) return
  if (partialAmount.value <= 0) {
    addToast('Gagal', 'Nominal pembayaran harus lebih besar dari 0', 'error')
    return
  }
  if (partialAmount.value > remainingBalance.value) {
    addToast('Gagal', 'Nominal melebihi sisa tagihan', 'error')
    return
  }

  try {
    submitting.value = true
    const res: any = await $fetch(`/api/payments/${props.payment.id}/transactions`, {
      method: 'POST',
      body: {
        amount: partialAmount.value,
        notes: partialNotes.value || undefined
      }
    })

    addToast('Berhasil', res.message || 'Pembayaran cicilan berhasil dicatat', 'success')
    isPartialModalOpen.value = false
    emit('transactionRecorded', props.payment.id)
  } catch (err: any) {
    addToast('Gagal', err.data?.statusMessage || 'Gagal mencatat pembayaran', 'error')
  } finally {
    submitting.value = false
  }
}

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
    month: 'short',
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
