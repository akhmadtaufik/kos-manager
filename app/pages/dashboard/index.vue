<script setup lang="ts">
import { usePropertyState } from '~/composables/usePropertyState'
import { 
  PhTrendUp, 
  PhTrendDown, 
  PhMinus,
  PhDoor, 
  PhUsers, 
  PhReceipt, 
  PhWallet, 
  PhWarningCircle, 
  PhCheckCircle, 
  PhChartBar, 
  PhMapPin,
  PhArrowRight,
  PhCalendarBlank,
  PhInfo
} from '@phosphor-icons/vue'

definePageMeta({
  layout: 'dashboard',
})

const { activePropertyId, activeProperty } = usePropertyState()
const { addToast } = useToast()
const router = useRouter()

const selectedMonth = ref(new Date().toISOString().slice(0, 7)) // YYYY-MM
const demoLevel = ref<'regency' | 'province'>('regency')

interface MoMMetrics {
  totalRoomsDelta: number
  occupiedRoomsDelta: number
  occupancyRateMoM: number
  revenueMoM: number
  expensesMoM: number
  netProfitMoM: number
}

interface RekapData {
  totalRooms: number
  occupiedRooms: number
  revenue: number
  expenses: number
  netProfit: number
  month: string
  previousMonth?: string
  previous?: {
    totalRooms: number
    occupiedRooms: number
    revenue: number
    expenses: number
    netProfit: number
  }
  mom: MoMMetrics
}

const rekap = ref<RekapData>({
  totalRooms: 0,
  occupiedRooms: 0,
  revenue: 0,
  expenses: 0,
  netProfit: 0,
  month: selectedMonth.value,
  mom: {
    totalRoomsDelta: 0,
    occupiedRoomsDelta: 0,
    occupancyRateMoM: 0,
    revenueMoM: 0,
    expensesMoM: 0,
    netProfitMoM: 0
  }
})
const loadingRekap = ref(false)

interface PnLTrendItem {
  month: string
  label: string
  revenue: number
  expenses: number
  netProfit: number
}
const pnlTrends = ref<PnLTrendItem[]>([])
const loadingTrends = ref(false)
const hoveredTrendIndex = ref<number | null>(null)

interface DemographicItem {
  id: string
  name: string
  type: string
  provinceName: string
  total: number
  percentage: number
}
const demographics = ref<DemographicItem[]>([])
const loadingDemo = ref(false)

interface ArrearItem {
  id: string
  tenantName: string
  roomNumber: string
  billingMonth: string
  totalAmount: number
  amountPaid: number
  remaining: number
  status: string
}
const topArrears = ref<ArrearItem[]>([])
const loadingArrears = ref(false)

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
}

const formatCompactCurrency = (val: number) => {
  if (Math.abs(val) >= 1_000_000_000) {
    return `Rp ${(val / 1_000_000_000).toFixed(1)}M`
  }
  if (Math.abs(val) >= 1_000_000) {
    return `Rp ${(val / 1_000_000).toFixed(1)}jt`
  }
  if (Math.abs(val) >= 1_000) {
    return `Rp ${(val / 1_000).toFixed(0)}rb`
  }
  return formatCurrency(val)
}

// Occupancy percentage computed
const occupancyPercent = computed(() => {
  if (!rekap.value.totalRooms) return 0
  return Math.round((rekap.value.occupiedRooms / rekap.value.totalRooms) * 100)
})

// Trend Chart Calculations (Max Scale)
const maxTrendValue = computed(() => {
  if (!pnlTrends.value.length) return 1000000
  const maxVal = Math.max(...pnlTrends.value.flatMap(t => [t.revenue, t.expenses]))
  return maxVal > 0 ? maxVal * 1.15 : 1000000
})

const fetchRekap = async () => {
  loadingRekap.value = true
  try {
    const query = new URLSearchParams()
    if (activePropertyId.value) query.append('propertyId', activePropertyId.value)
    if (selectedMonth.value) query.append('month', selectedMonth.value)
    
    const res = await $fetch<any>(`/api/reports/rekap?${query.toString()}`)
    if (res.status === 'success') {
      const data = res.data?.data || res.data
      rekap.value = {
        ...data,
        mom: data.mom || {
          totalRoomsDelta: 0,
          occupiedRoomsDelta: 0,
          occupancyRateMoM: 0,
          revenueMoM: 0,
          expensesMoM: 0,
          netProfitMoM: 0
        }
      }
    }
  } catch (e) {
    addToast('Gagal memuat data', 'Terjadi kesalahan saat mengambil rekap dashboard.', 'error')
  } finally {
    loadingRekap.value = false
  }
}

const fetchPnLTrends = async () => {
  loadingTrends.value = true
  try {
    const query = new URLSearchParams()
    if (activePropertyId.value) query.append('propertyId', activePropertyId.value)
    if (selectedMonth.value) query.append('month', selectedMonth.value)

    const res = await $fetch<any>(`/api/analytics/pnl-trend?${query.toString()}`)
    if (res.status === 'success') {
      pnlTrends.value = res.data?.data || res.data || []
    }
  } catch (e) {
    // Graceful fallback for trend charts
    pnlTrends.value = []
  } finally {
    loadingTrends.value = false
  }
}

const fetchDemographics = async () => {
  loadingDemo.value = true
  try {
    const query = new URLSearchParams()
    if (activePropertyId.value) query.append('propertyId', activePropertyId.value)
    query.append('level', demoLevel.value)

    const res = await $fetch<any>(`/api/analytics/demographics?${query.toString()}`)
    if (res.status === 'success') {
      demographics.value = res.data?.data || res.data || []
    }
  } catch (e) {
    addToast('Gagal memuat data', 'Terjadi kesalahan saat mengambil demografi.', 'error')
  } finally {
    loadingDemo.value = false
  }
}

const fetchTopArrears = async () => {
  loadingArrears.value = true
  try {
    const query = new URLSearchParams()
    if (activePropertyId.value) query.append('propertyId', activePropertyId.value)
    if (selectedMonth.value) query.append('billingMonth', selectedMonth.value)

    const res = await $fetch<any>(`/api/payments?${query.toString()}`)
    if (res.status === 'success') {
      const records = res.data?.items || res.data?.records || (Array.isArray(res.data) ? res.data : [])
      
      const unpaid = records
        .filter((r: any) => r.status !== 'paid')
        .map((r: any) => {
          const total = Number(r.totalAmount) || 0
          const paid = Number(r.amountPaid) || 0
          return {
            id: r.id,
            tenantName: r.tenant?.name || 'Penyewa',
            roomNumber: r.tenant?.room?.roomNumber ? `Kamar ${r.tenant.room.roomNumber}` : 'Kamar -',
            billingMonth: r.billingMonth,
            totalAmount: total,
            amountPaid: paid,
            remaining: Math.max(0, total - paid),
            status: r.status
          }
        })
        .filter((r: any) => r.remaining > 0)
        .sort((a: any, b: any) => b.remaining - a.remaining)
        .slice(0, 3)

      topArrears.value = unpaid
    }
  } catch (e) {
    topArrears.value = []
  } finally {
    loadingArrears.value = false
  }
}

// Re-fetch all data when property, month, or demographic level changes
watch([activePropertyId, selectedMonth], () => {
  fetchRekap()
  fetchPnLTrends()
  fetchDemographics()
  fetchTopArrears()
}, { immediate: true })

watch(demoLevel, () => {
  fetchDemographics()
})

const navigateToPayments = (paymentId?: string) => {
  if (paymentId) {
    router.push(`/payments?paymentId=${paymentId}`)
  } else {
    router.push('/payments')
  }
}
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl md:text-3xl font-extrabold text-surface-900 dark:text-surface-50 font-outfit tracking-tight">
          Dashboard Overview
        </h1>
        <p class="text-xs md:text-sm text-surface-500 dark:text-surface-400 mt-1">
          Pantau performa keuangan, okupansi kamar, dan analitik penyewa secara real-time
        </p>
      </div>

      <!-- Month Filter Control -->
      <div class="flex items-center gap-3 bg-white dark:bg-surface-900 p-1.5 rounded-2xl border border-surface-200/80 dark:border-surface-800 shadow-2xs">
        <div class="flex items-center gap-2 pl-3 text-surface-400">
          <PhCalendarBlank :size="18" weight="bold" />
          <span class="text-xs font-semibold text-surface-600 dark:text-surface-300">Bulan:</span>
        </div>
        <input 
          id="dashboard-month-filter"
          type="month" 
          v-model="selectedMonth" 
          class="px-3 py-1.5 border border-surface-200 dark:border-surface-700 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-xs font-bold text-surface-800 dark:text-surface-200 bg-surface-50 dark:bg-surface-800 outline-none transition-all cursor-pointer min-h-[38px]"
        />
      </div>
    </div>
    
    <!-- Global Scope Banner -->
    <div 
      v-if="!activeProperty" 
      class="p-4 rounded-2xl bg-gradient-to-r from-brand-50 via-blue-50/60 to-surface-50 dark:from-brand-950/30 dark:via-surface-900 dark:to-surface-900 border border-brand-200/70 dark:border-brand-800/50 flex items-center justify-between gap-4 shadow-2xs"
    >
      <div class="flex items-center gap-3.5">
        <div class="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
          <PhInfo :size="20" weight="bold" />
        </div>
        <div>
          <h2 class="font-bold text-xs md:text-sm text-surface-900 dark:text-surface-100">
            Mode Tinjauan Portofolio Global Aktif
          </h2>
          <p class="text-3xs md:text-xs text-surface-600 dark:text-surface-400 mt-0.5">
            Menampilkan data konsolidasi pendapatan, beban operasional, dan tingkat hunian dari seluruh cabang kos Anda.
          </p>
        </div>
      </div>
      <span class="hidden sm:inline-flex px-2.5 py-1 rounded-full text-3xs font-bold uppercase tracking-wider bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300">
        Konsolidasi
      </span>
    </div>

    <!-- 4 Top Summary KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="dashboard-summary-cards">
      <!-- 1. Total Kamar -->
      <div class="bg-white dark:bg-surface-900 rounded-2xl p-5 border border-surface-200/80 dark:border-surface-800 shadow-2xs hover:shadow-xs transition-all relative overflow-hidden group">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 font-outfit">Total Kapasitas</span>
          <div class="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <PhDoor :size="18" weight="bold" />
          </div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-extrabold text-surface-900 dark:text-surface-50 font-outfit tabular-nums tracking-tight">
            {{ loadingRekap ? '--' : rekap.totalRooms }}
          </span>
          <span class="text-xs text-surface-400 font-medium">unit</span>
        </div>
        <div class="mt-4 pt-3 border-t border-surface-100 dark:border-surface-800/80 flex items-center justify-between text-3xs">
          <div class="flex items-center gap-1.5 font-bold" :class="rekap.mom?.totalRoomsDelta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-surface-500'">
            <PhTrendUp v-if="rekap.mom?.totalRoomsDelta > 0" :size="12" weight="bold" />
            <PhMinus v-else :size="12" weight="bold" />
            <span id="mom-total-rooms">
              {{ rekap.mom?.totalRoomsDelta > 0 ? `+${rekap.mom.totalRoomsDelta} unit baru` : 'Kapasitas stabil' }}
            </span>
          </div>
          <span class="text-surface-400">vs bln lalu</span>
        </div>
      </div>

      <!-- 2. Kamar Terisi / Occupancy -->
      <div class="bg-white dark:bg-surface-900 rounded-2xl p-5 border border-surface-200/80 dark:border-surface-800 shadow-2xs hover:shadow-xs transition-all relative overflow-hidden group">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 font-outfit">Kamar Terisi</span>
          <div class="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <PhUsers :size="18" weight="bold" />
          </div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-outfit tabular-nums tracking-tight">
            {{ loadingRekap ? '--' : rekap.occupiedRooms }}
          </span>
          <span class="text-xs text-surface-400 font-medium">/ {{ rekap.totalRooms }} unit</span>
          <span class="ml-auto text-xs font-bold text-surface-700 dark:text-surface-300 tabular-nums">
            {{ occupancyPercent }}%
          </span>
        </div>
        <!-- Occupancy Bar -->
        <div class="w-full bg-surface-100 dark:bg-surface-800 rounded-full h-2 mt-3 overflow-hidden">
          <div 
            class="h-2 rounded-full transition-all duration-700 ease-out bg-emerald-500"
            :style="{ width: `${occupancyPercent}%` }"
          />
        </div>
        <div class="mt-3 pt-2.5 border-t border-surface-100 dark:border-surface-800/80 flex items-center justify-between text-3xs">
          <div 
            class="flex items-center gap-1 font-bold" 
            :class="rekap.mom?.occupancyRateMoM >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
          >
            <PhTrendUp v-if="rekap.mom?.occupancyRateMoM >= 0" :size="12" weight="bold" />
            <PhTrendDown v-else :size="12" weight="bold" />
            <span id="mom-occupancy-rate">
              {{ rekap.mom?.occupancyRateMoM >= 0 ? `+${rekap.mom.occupancyRateMoM}%` : `${rekap.mom.occupancyRateMoM}%` }}
            </span>
          </div>
          <span class="text-surface-400">MoM Okupansi</span>
        </div>
      </div>

      <!-- 3. Pengeluaran Operasional -->
      <div class="bg-white dark:bg-surface-900 rounded-2xl p-5 border border-surface-200/80 dark:border-surface-800 shadow-2xs hover:shadow-xs transition-all relative overflow-hidden group">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 font-outfit">Biaya Operasional</span>
          <div class="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <PhReceipt :size="18" weight="bold" />
          </div>
        </div>
        <div class="flex items-baseline">
          <span class="text-2xl font-extrabold text-surface-900 dark:text-surface-50 font-outfit tabular-nums tracking-tight truncate">
            {{ loadingRekap ? 'Rp --' : formatCurrency(rekap.expenses) }}
          </span>
        </div>
        <div class="mt-4 pt-3 border-t border-surface-100 dark:border-surface-800/80 flex items-center justify-between text-3xs">
          <!-- In expenses: higher expense is colored rose, lower expense is colored emerald -->
          <div 
            class="flex items-center gap-1 font-bold" 
            :class="rekap.mom?.expensesMoM <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
          >
            <PhTrendDown v-if="rekap.mom?.expensesMoM <= 0" :size="12" weight="bold" />
            <PhTrendUp v-else :size="12" weight="bold" />
            <span id="mom-expenses">
              {{ rekap.mom?.expensesMoM >= 0 ? `+${rekap.mom.expensesMoM}%` : `${rekap.mom.expensesMoM}%` }}
            </span>
          </div>
          <span class="text-surface-400">vs bulan lalu</span>
        </div>
      </div>

      <!-- 4. Total Pemasukan (Paid Revenue) -->
      <div class="bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 rounded-2xl p-5 text-white shadow-md relative overflow-hidden group">
        <div class="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-15 transition-opacity pointer-events-none">
          <PhWallet :size="110" weight="fill" />
        </div>
        <div class="flex items-center justify-between mb-3 relative z-10">
          <span class="text-xs font-bold uppercase tracking-wider text-brand-200 font-outfit">Pemasukan (Lunas)</span>
          <div class="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center backdrop-blur-xs">
            <PhWallet :size="18" weight="bold" />
          </div>
        </div>
        <div class="flex items-baseline relative z-10">
          <span class="text-2xl font-extrabold text-white font-outfit tabular-nums tracking-tight truncate">
            {{ loadingRekap ? 'Rp --' : formatCurrency(rekap.revenue) }}
          </span>
        </div>
        <div class="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-3xs relative z-10">
          <div 
            class="flex items-center gap-1 font-bold px-2 py-0.5 rounded-md backdrop-blur-xs" 
            :class="rekap.mom?.revenueMoM >= 0 ? 'bg-emerald-400/25 text-emerald-200' : 'bg-rose-400/25 text-rose-200'"
          >
            <PhTrendUp v-if="rekap.mom?.revenueMoM >= 0" :size="12" weight="bold" />
            <PhTrendDown v-else :size="12" weight="bold" />
            <span id="mom-revenue">
              {{ rekap.mom?.revenueMoM >= 0 ? `+${rekap.mom.revenueMoM}%` : `${rekap.mom.revenueMoM}%` }}
            </span>
          </div>
          <span class="text-brand-200">vs bulan lalu</span>
        </div>
      </div>
    </div>

    <!-- Asymmetrical Main Section (12-Column Grid) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
      
      <!-- LEFT SECTION: Financial Overview (P&L) + 6-Month SVG Sparkline (7 Cols) -->
      <div class="lg:col-span-7 space-y-7">
        <div class="bg-white dark:bg-surface-900 rounded-3xl p-6 md:p-7 border border-surface-200/80 dark:border-surface-800 shadow-2xs">
          <!-- Header -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-surface-100 dark:border-surface-800">
            <div>
              <h2 class="text-lg font-bold text-surface-900 dark:text-surface-50 font-outfit flex items-center gap-2">
                <PhChartBar :size="20" weight="bold" class="text-brand-600 dark:text-brand-400" />
                Financial Overview (P&L)
              </h2>
              <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                Struktur laba bersih dan tren trajektori performa 6 bulan terakhir
              </p>
            </div>
            <!-- Net Profit Live Badge -->
            <div class="text-left sm:text-right">
              <span class="text-3xs uppercase font-bold tracking-wider text-surface-400 block">Laba Bersih Bulan Ini</span>
              <span 
                id="net-profit-badge"
                class="text-xl md:text-2xl font-extrabold font-outfit tabular-nums"
                :class="rekap.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
              >
                {{ formatCurrency(rekap.netProfit) }}
              </span>
            </div>
          </div>

          <!-- P&L Visual Ratio Breakdown -->
          <div class="mt-6 p-4 rounded-2xl bg-surface-50/80 dark:bg-surface-850 border border-surface-200/60 dark:border-surface-800/80">
            <div class="flex items-center justify-between text-xs font-semibold mb-2">
              <span class="text-brand-700 dark:text-brand-300 flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-brand-600 inline-block" />
                Pemasukan: {{ formatCurrency(rekap.revenue) }}
              </span>
              <span class="text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                Pengeluaran: {{ formatCurrency(rekap.expenses) }}
              </span>
            </div>
            
            <!-- Proportional Dual Bar -->
            <div class="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-3 flex overflow-hidden">
              <div 
                class="bg-brand-600 h-full transition-all duration-500" 
                :style="{ width: `${rekap.revenue + rekap.expenses > 0 ? (rekap.revenue / (rekap.revenue + rekap.expenses)) * 100 : 50}%` }"
                title="Pemasukan"
              />
              <div 
                class="bg-rose-500 h-full transition-all duration-500" 
                :style="{ width: `${rekap.revenue + rekap.expenses > 0 ? (rekap.expenses / (rekap.revenue + rekap.expenses)) * 100 : 50}%` }"
                title="Pengeluaran"
              />
            </div>
          </div>

          <!-- 6-Month Historical P&L Trend Micro-Chart (SVG Sparklines) -->
          <div class="mt-7">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-xs font-bold uppercase tracking-wider text-surface-600 dark:text-surface-300 font-outfit">
                  Tren Keuangan 6 Bulan Terakhir
                </h3>
                <p class="text-3xs text-surface-400">Komparasi pendapatan, beban, dan profitabilitas antar periode</p>
              </div>
              <div class="flex items-center gap-4 text-3xs font-semibold text-surface-500">
                <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-brand-600" /> Revenue</span>
                <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-rose-500" /> Expenses</span>
              </div>
            </div>

            <!-- SVG Micro-Chart Container -->
            <div v-if="loadingTrends" class="h-44 flex items-center justify-center text-xs text-surface-400">
              Memuat grafik tren...
            </div>
            <div v-else-if="!pnlTrends.length" class="h-44 flex items-center justify-center text-xs text-surface-400">
              Belum ada riwayat data keuangan 6 bulan terakhir.
            </div>
            <div v-else class="relative pt-2" id="pnl-trend-sparklines">
              <!-- Interactive Bars Grid -->
              <div class="grid grid-cols-6 gap-2 sm:gap-4 h-40 items-end border-b border-surface-200 dark:border-surface-800 pb-2">
                <div 
                  v-for="(t, idx) in pnlTrends" 
                  :key="t.month"
                  @mouseenter="hoveredTrendIndex = idx"
                  @mouseleave="hoveredTrendIndex = null"
                  class="flex flex-col items-center h-full justify-end group/bar cursor-pointer relative"
                >
                  <!-- Tooltip Hover Card -->
                  <div 
                    v-if="hoveredTrendIndex === idx"
                    class="absolute -top-16 z-30 px-3 py-2 bg-surface-900 text-white rounded-xl shadow-xl text-3xs whitespace-nowrap pointer-events-none transition-all transform -translate-x-1/2 left-1/2"
                  >
                    <p class="font-bold text-brand-300 mb-0.5">{{ t.label }} ({{ t.month }})</p>
                    <p class="tabular-nums">Rev: {{ formatCompactCurrency(t.revenue) }}</p>
                    <p class="tabular-nums">Exp: {{ formatCompactCurrency(t.expenses) }}</p>
                    <p class="font-bold tabular-nums" :class="t.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                      Net: {{ formatCompactCurrency(t.netProfit) }}
                    </p>
                  </div>

                  <!-- Bar Pairs -->
                  <div class="flex items-end gap-1 w-full max-w-[36px] justify-center h-full pb-1">
                    <!-- Revenue Bar -->
                    <div 
                      class="w-1/2 bg-brand-500/80 group-hover/bar:bg-brand-600 rounded-t-sm transition-all duration-300 min-h-[4px]"
                      :style="{ height: `${Math.max(4, (t.revenue / maxTrendValue) * 100)}%` }"
                    />
                    <!-- Expense Bar -->
                    <div 
                      class="w-1/2 bg-rose-400/80 group-hover/bar:bg-rose-500 rounded-t-sm transition-all duration-300 min-h-[4px]"
                      :style="{ height: `${Math.max(4, (t.expenses / maxTrendValue) * 100)}%` }"
                    />
                  </div>

                  <!-- Month Label -->
                  <span 
                    class="text-3xs font-bold mt-2 transition-colors"
                    :class="t.month === selectedMonth ? 'text-brand-600 dark:text-brand-400 font-extrabold' : 'text-surface-400'"
                  >
                    {{ t.label }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Demographics Breakdown Card -->
        <div class="bg-white dark:bg-surface-900 rounded-3xl p-6 md:p-7 border border-surface-200/80 dark:border-surface-800 shadow-2xs" id="dashboard-demographics-card">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-surface-100 dark:border-surface-800">
            <div>
              <h2 class="text-lg font-bold text-surface-900 dark:text-surface-50 font-outfit flex items-center gap-2">
                <PhMapPin :size="20" weight="bold" class="text-indigo-600 dark:text-indigo-400" />
                Demografi Daerah Asal Penghuni
              </h2>
              <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                Klasifikasi wilayah domisili KTP penghuni terdaftar (Standar Kemendagri)
              </p>
            </div>

            <!-- Granularity Level Toggle -->
            <div class="inline-flex p-1 bg-surface-100 dark:bg-surface-800 rounded-xl">
              <button 
                type="button"
                @click="demoLevel = 'regency'"
                class="px-3 py-1 text-3xs font-bold rounded-lg transition-all"
                :class="demoLevel === 'regency' ? 'bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 shadow-2xs' : 'text-surface-500 hover:text-surface-800'"
              >
                Kota / Kabupaten
              </button>
              <button 
                type="button"
                @click="demoLevel = 'province'"
                class="px-3 py-1 text-3xs font-bold rounded-lg transition-all"
                :class="demoLevel === 'province' ? 'bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 shadow-2xs' : 'text-surface-500 hover:text-surface-800'"
              >
                Provinsi
              </button>
            </div>
          </div>

          <!-- Demographics List -->
          <div class="mt-6">
            <div v-if="loadingDemo" class="space-y-4">
              <div v-for="i in 3" :key="i" class="animate-pulse space-y-2">
                <div class="h-4 bg-surface-100 dark:bg-surface-800 rounded w-1/3" />
                <div class="h-2 bg-surface-100 dark:bg-surface-800 rounded w-full" />
              </div>
            </div>

            <div v-else-if="!demographics.length" class="text-center py-10 text-surface-400">
              <PhUsers :size="40" class="mx-auto text-surface-300 mb-2" />
              <p class="text-xs font-medium">Belum ada data penghuni aktif untuk properti ini.</p>
            </div>

            <div v-else class="space-y-4 max-h-[340px] overflow-y-auto pr-2">
              <div 
                v-for="item in demographics" 
                :key="item.id"
                class="p-3 rounded-2xl bg-surface-50/70 dark:bg-surface-850 border border-surface-200/50 dark:border-surface-800/60 transition-all hover:border-brand-300"
              >
                <div class="flex items-center justify-between text-xs mb-1.5">
                  <div class="flex items-center gap-2 truncate">
                    <span 
                      v-if="item.type === 'KOTA'" 
                      class="px-1.5 py-0.5 rounded text-4xs font-extrabold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex-shrink-0"
                    >
                      KOTA
                    </span>
                    <span 
                      v-else-if="item.type === 'KABUPATEN'" 
                      class="px-1.5 py-0.5 rounded text-4xs font-extrabold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex-shrink-0"
                    >
                      KABUPATEN
                    </span>
                    <span class="font-bold text-surface-900 dark:text-surface-100 truncate">
                      {{ item.name }}
                    </span>
                    <span v-if="item.provinceName && item.provinceName !== '-'" class="text-3xs text-surface-400 hidden sm:inline">
                      ({{ item.provinceName }})
                    </span>
                  </div>
                  <span class="text-xs font-extrabold text-surface-900 dark:text-surface-100 tabular-nums flex-shrink-0 ml-2">
                    {{ item.total }} <span class="text-3xs font-medium text-surface-400">({{ item.percentage }}%)</span>
                  </span>
                </div>

                <!-- Distribution Bar -->
                <div class="w-full bg-surface-200/70 dark:bg-surface-700 rounded-full h-1.5 overflow-hidden">
                  <div 
                    class="h-1.5 rounded-full transition-all duration-700 ease-out"
                    :class="item.type === 'KOTA' ? 'bg-blue-500' : 'bg-purple-500'"
                    :style="{ width: `${item.percentage}%` }"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT SECTION: "Perlu Perhatian" (Action Needed Widget) (5 Cols) -->
      <div class="lg:col-span-5 space-y-7">
        <div class="bg-white dark:bg-surface-900 rounded-3xl p-6 md:p-7 border border-surface-200/80 dark:border-surface-800 shadow-2xs" id="dashboard-action-needed-widget">
          <!-- Widget Header -->
          <div class="flex items-center justify-between pb-5 border-b border-surface-100 dark:border-surface-800">
            <div>
              <h2 class="text-lg font-bold text-surface-900 dark:text-surface-50 font-outfit flex items-center gap-2">
                <PhWarningCircle :size="20" weight="bold" class="text-amber-500" />
                Perlu Perhatian
              </h2>
              <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                Penyewa dengan tunggakan pembayaran tertinggi
              </p>
            </div>
            <button 
              type="button" 
              @click="navigateToPayments()"
              class="text-3xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1"
            >
              Lihat Semua <PhArrowRight :size="12" weight="bold" />
            </button>
          </div>

          <!-- Arrears Content -->
          <div class="mt-6">
            <div v-if="loadingArrears" class="space-y-4">
              <div v-for="i in 3" :key="i" class="animate-pulse p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/50 space-y-2">
                <div class="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/2" />
                <div class="h-3 bg-surface-200 dark:bg-surface-700 rounded w-1/3" />
              </div>
            </div>

            <!-- Zero Arrears State -->
            <div v-else-if="!topArrears.length" class="text-center py-10 px-4">
              <div class="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <PhCheckCircle :size="28" weight="fill" />
              </div>
              <h4 class="text-sm font-bold text-surface-900 dark:text-surface-100 font-outfit">
                Semua Tagihan Lunas
              </h4>
              <p class="text-xs text-surface-500 dark:text-surface-400 mt-1 max-w-[240px] mx-auto">
                Tidak ada tunggakan jatuh tempo untuk periode bulan laporan ini.
              </p>
            </div>

            <!-- Top 3 Overdue Arrears Items -->
            <div v-else class="space-y-3.5">
              <div 
                v-for="item in topArrears" 
                :key="item.id"
                class="p-4 rounded-2xl bg-surface-50/80 dark:bg-surface-850 border border-surface-200/70 dark:border-surface-800/80 flex flex-col gap-3 hover:border-amber-300 dark:hover:border-amber-700/60 transition-all group"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h4 class="text-sm font-bold text-surface-900 dark:text-surface-100 font-outfit leading-snug">
                      {{ item.tenantName }}
                    </h4>
                    <span class="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-3xs font-semibold bg-surface-200/60 dark:bg-surface-700 text-surface-700 dark:text-surface-300">
                      {{ item.roomNumber }}
                    </span>
                  </div>

                  <div class="text-right">
                    <span class="text-xs font-extrabold text-rose-600 dark:text-rose-400 tabular-nums block">
                      {{ formatCurrency(item.remaining) }}
                    </span>
                    <span 
                      class="text-4xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      :class="item.status === 'partial' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'"
                    >
                      {{ item.status === 'partial' ? 'Cicilan' : 'Belum Lunas' }}
                    </span>
                  </div>
                </div>

                <!-- Action Button -->
                <div class="pt-2.5 border-t border-surface-200/50 dark:border-surface-800 flex items-center justify-between">
                  <span class="text-3xs text-surface-400">Periode {{ item.billingMonth }}</span>
                  <button 
                    type="button"
                    @click="navigateToPayments(item.id)"
                    class="px-3 py-1 rounded-lg bg-white dark:bg-surface-800 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/50 dark:hover:text-brand-400 border border-surface-200 dark:border-surface-700 text-3xs font-bold text-surface-700 dark:text-surface-300 transition-all flex items-center gap-1"
                  >
                    <span>Catat Bayar</span>
                    <PhArrowRight :size="10" weight="bold" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Tips / Occupancy Health Helper Card -->
        <div class="bg-gradient-to-br from-indigo-50/70 via-brand-50/40 to-surface-50 dark:from-surface-900 dark:via-surface-900 dark:to-surface-850 p-6 rounded-3xl border border-indigo-100 dark:border-surface-800">
          <h3 class="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 font-outfit mb-1.5 flex items-center gap-2">
            <PhInfo :size="16" weight="bold" />
            Tips Optimalisasi Okupansi
          </h3>
          <p class="text-xs text-surface-600 dark:text-surface-400 leading-relaxed">
            Tingkat hunian di atas 80% menunjukkan stabilitas arus kas yang prima. Pertahankan promosi pada kanal digital untuk kamar yang saat ini berstatus kosong.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
