<template>
  <div class="space-y-6 max-w-7xl mx-auto pb-12">
    <!-- Global View Notice -->
    <div v-if="!activeProperty" class="bg-brand-50/80 dark:bg-brand-950/40 text-brand-800 dark:text-brand-300 p-4 rounded-2xl border border-brand-100 dark:border-brand-900/60 flex items-center gap-3 shadow-2xs">
      <div class="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
        <PhBuildings :size="18" weight="duotone" />
      </div>
      <div class="flex-1 text-xs">
        <span class="font-bold text-surface-900 dark:text-surface-100">Mode Global View Aktif</span> — Menampilkan seluruh tagihan dari semua properti. Pilih properti spesifik pada dropdown atas untuk membuat tagihan baru.
      </div>
    </div>

    <!-- Header & Action Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 dark:bg-surface-900/70 backdrop-blur-md p-5 rounded-2xl border border-surface-200/80 dark:border-surface-800 shadow-xs">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
          <PhCreditCard :size="22" weight="bold" />
        </div>
        <div>
          <h1 class="text-xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
            Tagihan & Pembayaran
          </h1>
          <p class="text-xs text-surface-500 dark:text-surface-400">
            Buku besar tagihan sewa dan pencatatan cicilan / pembayaran sebagian penghuni.
          </p>
        </div>
      </div>

      <!-- Action Controls -->
      <div class="flex flex-wrap items-center gap-2.5">
        <input 
          type="month" 
          v-model="selectedMonth" 
          id="billing-month-select"
          class="rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-xs font-semibold text-surface-800 dark:text-surface-200 shadow-2xs focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none"
        />
        <button 
          @click="generateInvoices" 
          :disabled="generating" 
          id="btn-generate-invoices"
          class="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-2xs active:scale-95 whitespace-nowrap"
        >
          <PhLightning :size="14" weight="bold" :class="{ 'animate-spin': generating }" />
          <span>{{ generating ? 'Membuat Tagihan...' : 'Buat Tagihan Bulan Ini' }}</span>
        </button>
      </div>
    </div>

    <!-- 3 Mini Summary Metric Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <!-- Total Tertagih -->
      <div class="p-4 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200/80 dark:border-surface-800 shadow-2xs flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
          <PhReceipt :size="20" weight="duotone" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-medium text-surface-500 dark:text-surface-400">Total Tertagih</p>
          <p class="text-lg font-bold text-surface-900 dark:text-surface-50 tabular-nums truncate">
            Rp {{ formatNumber(summaryMetrics.totalBilled) }}
          </p>
          <span class="text-3xs text-surface-400 font-semibold">{{ summaryMetrics.countTotal }} Total Invoice</span>
        </div>
      </div>

      <!-- Total Terbayar -->
      <div class="p-4 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200/80 dark:border-surface-800 shadow-2xs flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
          <PhCheckCircle :size="20" weight="duotone" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-medium text-surface-500 dark:text-surface-400">Total Kas Diterima</p>
          <p class="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums truncate">
            Rp {{ formatNumber(summaryMetrics.totalPaid) }}
          </p>
          <span class="text-3xs text-emerald-600 dark:text-emerald-400 font-semibold">
            {{ summaryMetrics.countPaid }} Lunas, {{ summaryMetrics.countPartial }} Sebagian
          </span>
        </div>
      </div>

      <!-- Sisa Piutang -->
      <div class="p-4 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200/80 dark:border-surface-800 shadow-2xs flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
          <PhClock :size="20" weight="duotone" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-medium text-surface-500 dark:text-surface-400">Sisa Piutang (Belum Masuk)</p>
          <p class="text-lg font-bold text-rose-600 dark:text-rose-400 tabular-nums truncate">
            Rp {{ formatNumber(summaryMetrics.totalOutstanding) }}
          </p>
          <span class="text-3xs text-rose-600 dark:text-rose-400 font-semibold">
            {{ summaryMetrics.countUnpaid }} Belum Bayar
          </span>
        </div>
      </div>
    </div>

    <!-- Segmented Tabs & Main Table -->
    <div class="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200/80 dark:border-surface-800 shadow-xs overflow-hidden">
      <!-- Segmented Control Tab Header -->
      <div class="p-4 border-b border-surface-100 dark:border-surface-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-50/50 dark:bg-surface-800/30">
        <!-- Tab Buttons -->
        <div class="inline-flex flex-wrap p-1 rounded-xl bg-surface-200/60 dark:bg-surface-800 border border-surface-200/80 dark:border-surface-700/60">
          <button
            type="button"
            @click="activeTab = 'all'"
            id="tab-all-payments"
            class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
            :class="[
              activeTab === 'all'
                ? 'bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-50 shadow-2xs'
                : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'
            ]"
          >
            <span>Semua</span>
            <span class="px-1.5 py-0.2 rounded-full text-3xs font-bold bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 tabular-nums">
              {{ summaryMetrics.countTotal }}
            </span>
          </button>

          <button
            type="button"
            @click="activeTab = 'unpaid'"
            id="tab-unpaid-payments"
            class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
            :class="[
              activeTab === 'unpaid'
                ? 'bg-white dark:bg-surface-900 text-rose-600 dark:text-rose-400 shadow-2xs'
                : 'text-surface-600 dark:text-surface-400 hover:text-rose-600 dark:hover:text-rose-400'
            ]"
          >
            <span>Belum Lunas</span>
            <span class="px-1.5 py-0.2 rounded-full text-3xs font-bold bg-rose-100/80 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 tabular-nums">
              {{ summaryMetrics.countUnpaid }}
            </span>
          </button>

          <button
            type="button"
            @click="activeTab = 'partial'"
            id="tab-partial-payments"
            class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
            :class="[
              activeTab === 'partial'
                ? 'bg-white dark:bg-surface-900 text-amber-600 dark:text-amber-400 shadow-2xs'
                : 'text-surface-600 dark:text-surface-400 hover:text-amber-600 dark:hover:text-amber-400'
            ]"
          >
            <span>Sebagian (Cicilan)</span>
            <span class="px-1.5 py-0.2 rounded-full text-3xs font-bold bg-amber-100/80 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 tabular-nums">
              {{ summaryMetrics.countPartial }}
            </span>
          </button>

          <button
            type="button"
            @click="activeTab = 'paid'"
            id="tab-paid-payments"
            class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
            :class="[
              activeTab === 'paid'
                ? 'bg-white dark:bg-surface-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-surface-600 dark:text-surface-400 hover:text-emerald-600 dark:hover:text-emerald-400'
            ]"
          >
            <span>Lunas</span>
            <span class="px-1.5 py-0.2 rounded-full text-3xs font-bold bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 tabular-nums">
              {{ summaryMetrics.countPaid }}
            </span>
          </button>
        </div>

        <!-- Refresh Button -->
        <button
          @click="fetchPayments"
          :disabled="pending"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-surface-600 dark:text-surface-300 bg-white dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 border border-surface-200 dark:border-surface-700 transition-all active:scale-95 shadow-2xs self-end sm:self-auto"
        >
          <PhArrowClockwise :size="13" weight="bold" :class="{ 'animate-spin': pending }" />
          <span>Refresh</span>
        </button>
      </div>

      <!-- Loading Skeleton -->
      <div v-if="pending" class="divide-y divide-surface-100 dark:divide-surface-800 p-4 space-y-3">
        <div v-for="i in 4" :key="'skel-' + i" class="p-4 rounded-xl bg-surface-50/60 dark:bg-surface-800/40 animate-pulse flex items-center justify-between">
          <div class="space-y-2">
            <div class="h-4 bg-surface-200 dark:bg-surface-700 rounded w-36"></div>
            <div class="h-3 bg-surface-200 dark:bg-surface-700 rounded w-24"></div>
          </div>
          <div class="h-4 bg-surface-200 dark:bg-surface-700 rounded w-20"></div>
          <div class="h-8 bg-surface-200 dark:bg-surface-700 rounded w-24"></div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredPayments.length === 0" class="py-16 px-4 text-center">
        <div class="w-12 h-12 mx-auto rounded-2xl bg-surface-100 dark:bg-surface-800 text-surface-400 flex items-center justify-center mb-3">
          <PhReceipt :size="24" weight="duotone" />
        </div>
        <h3 class="text-sm font-bold text-surface-900 dark:text-surface-100">Tidak ada data tagihan</h3>
        <p class="text-xs text-surface-500 dark:text-surface-400 max-w-sm mx-auto mt-1">
          Belum ada tagihan sewa pada kategori atau bulan yang dipilih.
        </p>
      </div>

      <!-- Data Table View -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="text-2xs font-bold uppercase tracking-wider text-surface-500 bg-surface-50/80 dark:bg-surface-800/60 border-b border-surface-200/80 dark:border-surface-800">
            <tr>
              <th v-if="!activeProperty" scope="col" class="px-5 py-3.5">Properti</th>
              <th scope="col" class="px-5 py-3.5">Penghuni & Kamar</th>
              <th scope="col" class="px-5 py-3.5">Bulan Tagihan</th>
              <th scope="col" class="px-5 py-3.5">Terbayar / Total Tagihan</th>
              <th scope="col" class="px-5 py-3.5">Status Pembayaran</th>
              <th scope="col" class="px-5 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
            <tr 
              v-for="payment in filteredPayments" 
              :key="payment.id"
              @click="openInvoiceSlideOver(payment)"
              class="hover:bg-surface-50/80 dark:hover:bg-surface-800/50 transition-colors cursor-pointer group"
            >
              <!-- Property Name (Global View) -->
              <td v-if="!activeProperty" class="px-5 py-4 font-bold text-surface-800 dark:text-surface-200">
                {{ payment.property?.name || '-' }}
              </td>

              <!-- Tenant & Room -->
              <td class="px-5 py-4">
                <div>
                  <p class="font-bold text-surface-900 dark:text-surface-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {{ payment.tenant?.name || 'Deleted Tenant' }}
                  </p>
                  <span class="inline-flex items-center gap-1 text-3xs text-surface-500">
                    <PhDoor :size="11" weight="bold" />
                    Kamar {{ payment.tenant?.room?.roomNumber || '-' }}
                  </span>
                </div>
              </td>

              <!-- Billing Month -->
              <td class="px-5 py-4 text-surface-600 dark:text-surface-300 font-medium">
                {{ formatBillingMonth(payment.billingMonth) }}
              </td>

              <!-- Paid Amount / Total Amount with mini progress -->
              <td class="px-5 py-4">
                <div class="space-y-1">
                  <p class="font-bold text-surface-900 dark:text-surface-100 tabular-nums">
                    Rp {{ formatNumber(payment.amountPaid || 0) }} 
                    <span class="text-surface-400 font-normal">/ Rp {{ formatNumber(payment.totalAmount) }}</span>
                  </p>
                  <div class="w-28 h-1.5 rounded-full bg-surface-100 dark:bg-surface-700 overflow-hidden">
                    <div 
                      class="h-full rounded-full transition-all duration-300"
                      :class="payment.status === 'paid' ? 'bg-emerald-500' : (payment.status === 'partial' ? 'bg-amber-500' : 'bg-rose-500')"
                      :style="{ width: `${calculatePercentage(payment.amountPaid, payment.totalAmount)}%` }"
                    />
                  </div>
                </div>
              </td>

              <!-- Status with Minimalist Indicator Dot -->
              <td class="px-5 py-4">
                <div class="flex flex-col gap-0.5">
                  <div class="flex items-center gap-1.5">
                    <span 
                      class="w-2 h-2 rounded-full flex-shrink-0"
                      :class="[
                        payment.status === 'paid' ? 'bg-emerald-500' : 
                        (payment.status === 'partial' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500 animate-pulse')
                      ]"
                    />
                    <span 
                      class="font-bold text-xs"
                      :class="[
                        payment.status === 'paid' ? 'text-emerald-700 dark:text-emerald-400' : 
                        (payment.status === 'partial' ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400')
                      ]"
                    >
                      {{ 
                        payment.status === 'paid' ? 'Lunas' : 
                        (payment.status === 'partial' ? 'Bayar Sebagian' : 'Belum Lunas') 
                      }}
                    </span>
                  </div>
                  <span v-if="payment.status === 'paid' && payment.paidAt" class="text-3xs text-surface-400 tabular-nums pl-3.5">
                    {{ formatDate(payment.paidAt) }}
                  </span>
                  <span v-else-if="payment.status === 'partial'" class="text-3xs text-amber-600 dark:text-amber-400 font-semibold tabular-nums pl-3.5">
                    Sisa Rp {{ formatNumber(Math.max(0, Number(payment.totalAmount) - Number(payment.amountPaid || 0))) }}
                  </span>
                </div>
              </td>

              <!-- Action Button -->
              <td class="px-5 py-4 text-right">
                <button 
                  v-if="payment.status !== 'paid'" 
                  @click.stop="openInvoiceSlideOver(payment)" 
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-300 dark:hover:bg-brand-900/50 border border-brand-200 dark:border-brand-800 transition-all active:scale-95 shadow-2xs whitespace-nowrap"
                  title="Buka Rincian & Catat Pembayaran"
                >
                  <PhReceipt :size="14" weight="bold" />
                  <span>Kelola</span>
                </button>
                <span v-else class="text-3xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800/60">
                  Terverifikasi
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detailed Invoice Slide-over Off-canvas Panel -->
    <InvoiceSlideOver
      v-model="isSlideOverOpen"
      :payment="selectedPayment"
      @marked-paid="handleSlideOverMarkPaid"
      @transaction-recorded="handleTransactionRecorded"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { usePropertyState } from '~/composables/usePropertyState'
import { useConfirm } from '~/composables/useConfirm'
import InvoiceSlideOver from '~/components/InvoiceSlideOver.vue'
import { 
  PhCreditCard, 
  PhReceipt, 
  PhCheckCircle, 
  PhClock, 
  PhLightning, 
  PhArrowClockwise, 
  PhBuildings, 
  PhDoor 
} from '@phosphor-icons/vue'

definePageMeta({
  layout: 'dashboard',
})

const { activePropertyId, activeProperty, properties, loadProperties } = usePropertyState()
const { addToast } = useToast()
const { confirm } = useConfirm()

onMounted(async () => {
  if (properties.value.length === 0) {
    await loadProperties(true)
  }
  if (!activePropertyId.value && properties.value.length > 0) {
    activePropertyId.value = properties.value[0].id
  }
})

const selectedMonth = ref(new Date().toISOString().slice(0, 7)) // YYYY-MM
const generating = ref(false)
const pending = ref(false)
const activeTab = ref<'all' | 'unpaid' | 'partial' | 'paid'>('all')

const rawPayments = ref<any[]>([])
const summaryMetrics = ref({
  totalBilled: 0,
  totalPaid: 0,
  totalOutstanding: 0,
  countTotal: 0,
  countPaid: 0,
  countPartial: 0,
  countUnpaid: 0
})

// Slide-over State
const isSlideOverOpen = ref(false)
const selectedPayment = ref<any | null>(null)

const openInvoiceSlideOver = async (payment: any) => {
  selectedPayment.value = payment
  isSlideOverOpen.value = true
  // Fetch freshest details including transactions
  if (payment?.id) {
    try {
      const res = await $fetch<any>(`/api/payments/${payment.id}`)
      if (res.status === 'success' && res.data) {
        selectedPayment.value = res.data
      }
    } catch (e) {
      // fallback to current object
    }
  }
}

const fetchPayments = async () => {
  pending.value = true
  try {
    const params: Record<string, string> = {}
    if (activePropertyId.value) {
      params.propertyId = activePropertyId.value
    }
    if (selectedMonth.value) {
      params.billingMonth = selectedMonth.value
    }

    const queryStr = new URLSearchParams(params).toString()
    const res = await $fetch<any>(`/api/payments?${queryStr}`)
    
    if (res.status === 'success') {
      const payload = res.data || {}
      if (Array.isArray(payload)) {
        rawPayments.value = payload
        recalculateLocalSummary(payload)
      } else {
        rawPayments.value = payload.items || payload.data || []
        if (payload.summary) {
          summaryMetrics.value = payload.summary
        } else {
          recalculateLocalSummary(rawPayments.value)
        }
      }

      // Update selected payment if slide-over is active
      if (selectedPayment.value) {
        const found = rawPayments.value.find(p => p.id === selectedPayment.value.id)
        if (found) {
          // If found, fetch fresh details
          try {
            const detailRes = await $fetch<any>(`/api/payments/${found.id}`)
            if (detailRes.status === 'success' && detailRes.data) {
              selectedPayment.value = detailRes.data
            } else {
              selectedPayment.value = found
            }
          } catch {
            selectedPayment.value = found
          }
        }
      }
    }
  } catch (err) {
    addToast('Gagal memuat data', 'Terjadi kesalahan saat mengambil daftar pembayaran.', 'error')
  } finally {
    pending.value = false
  }
}

const recalculateLocalSummary = (items: any[]) => {
  let totalBilled = 0
  let totalPaid = 0
  let totalOutstanding = 0
  let countPaid = 0
  let countPartial = 0
  let countUnpaid = 0

  for (const item of items) {
    const total = Number(item.totalAmount) || 0
    const paid = Number(item.amountPaid) || 0
    const remaining = Math.max(0, total - paid)

    totalBilled += total
    totalPaid += paid
    totalOutstanding += remaining

    if (item.status === 'paid') {
      countPaid++
    } else if (item.status === 'partial') {
      countPartial++
    } else {
      countUnpaid++
    }
  }

  summaryMetrics.value = {
    totalBilled,
    totalPaid,
    totalOutstanding,
    countTotal: items.length,
    countPaid,
    countPartial,
    countUnpaid
  }
}

// Client-Side Segmented Tab Filter
const filteredPayments = computed(() => {
  if (activeTab.value === 'paid') {
    return rawPayments.value.filter(p => p.status === 'paid')
  }
  if (activeTab.value === 'partial') {
    return rawPayments.value.filter(p => p.status === 'partial')
  }
  if (activeTab.value === 'unpaid') {
    return rawPayments.value.filter(p => p.status === 'unpaid')
  }
  return rawPayments.value
})

watch([activePropertyId, selectedMonth], () => {
  fetchPayments()
}, { immediate: true })

async function generateInvoices() {
  if (properties.value.length === 0) {
    await loadProperties(true)
  }
  const targetPropId = activeProperty.value?.id || properties.value[0]?.id
  if (!targetPropId) {
    addToast('Peringatan', 'Silakan pilih properti terlebih dahulu.', 'warning')
    return
  }
  try {
    generating.value = true

    const res: any = await $fetch('/api/payments/generate', {
      method: 'POST',
      body: {
        propertyId: targetPropId,
        billingMonth: selectedMonth.value
      }
    })

    addToast('Berhasil', res.message || 'Tagihan berhasil dibuat', 'success')
    await fetchPayments()
  } catch (e: any) {
    addToast('Gagal', e.data?.statusMessage || 'Gagal membuat tagihan.', 'error')
  } finally {
    generating.value = false
  }
}

async function markAsPaid(id: string) {
  const isConfirmed = await confirm({
    title: 'Konfirmasi Pelunasan Penuh',
    message: 'Apakah Anda yakin ingin melunasi seluruh sisa tagihan sewa ini?',
    confirmText: 'Ya, Lunasi Sekarang',
    cancelText: 'Batal',
    type: 'primary'
  })

  if (!isConfirmed) return

  try {
    await $fetch(`/api/payments/${id}`, {
      method: 'PATCH'
    })
    addToast('Berhasil', 'Tagihan berhasil dilunasi sepenuhnya.', 'success')
    await fetchPayments()
  } catch (e: any) {
    addToast('Gagal', e.data?.statusMessage || 'Gagal mengubah status tagihan.', 'error')
  }
}

const handleSlideOverMarkPaid = async (id: string) => {
  await markAsPaid(id)
}

const handleTransactionRecorded = async (_paymentId: string) => {
  await fetchPayments()
}

// Formatting Helpers
const calculatePercentage = (paid: any, total: any) => {
  const paidNum = Number(paid) || 0
  const totalNum = Number(total) || 0
  if (totalNum <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((paidNum / totalNum) * 100)))
}

const formatNumber = (val: any) => {
  const num = Number(val)
  if (isNaN(num)) return '0'
  return num.toLocaleString('id-ID')
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(dateString))
}

const formatBillingMonth = (monthString: string) => {
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
