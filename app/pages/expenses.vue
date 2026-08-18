<template>
  <div>
    <!-- Global View Banner -->
    <div v-if="!activeProperty" class="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 mb-8 flex items-center gap-3">
      <div class="flex-1">
        <h2 class="font-bold text-sm">Mode Global View Aktif</h2>
        <p class="text-xs">Menampilkan seluruh pengeluaran dari semua properti. Pilih properti spesifik di menu atas untuk mencatat atau mengedit pengeluaran.</p>
      </div>
    </div>

    <div>
      <!-- Header & Quick Stats -->
      <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50 tracking-tight font-sans">Pengeluaran Operasional</h1>
          <p class="text-sm text-surface-500 mt-1">Kelola dan pantau seluruh pengeluaran operasional properti Anda secara berkala.</p>
        </div>
        
        <div class="flex items-center gap-3">
          <!-- Quick Stats -->
          <div class="bg-white dark:bg-surface-800 px-5 py-3 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm flex-col justify-center hidden sm:flex">
            <span class="text-[11px] font-bold text-surface-500 uppercase tracking-wider">
              Total {{ getMonthName(selectedMonth) }} {{ selectedYear }}
            </span>
            <span class="text-lg font-bold text-rose-600 dark:text-rose-400">Rp {{ totalExpenses.toLocaleString('id-ID') }}</span>
          </div>
          
          <button 
            v-if="activeProperty" 
            @click="openCategoryCreatorStandalone" 
            class="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 px-4 py-3 rounded-xl font-medium hover:bg-surface-50 dark:hover:bg-surface-700 transition-all shadow-sm active:scale-95 flex items-center gap-2 text-sm"
          >
            <PhTag :size="18" weight="bold" />
            <span class="hidden sm:inline">Kategori Baru</span>
          </button>
          
          <button 
            v-if="activeProperty" 
            @click="openCreateModal" 
            class="bg-slate-900 dark:bg-brand-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-slate-800 dark:hover:bg-brand-700 transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2 text-sm"
          >
            <PhPlus :size="18" weight="bold" />
            <span>Catat <span class="hidden sm:inline">Pengeluaran</span></span>
          </button>
        </div>
      </div>

      <!-- Month & Year Filter Bar -->
      <div class="bg-white dark:bg-surface-800 p-3.5 sm:p-4 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-surface-600 dark:text-surface-300 flex-shrink-0">
            <PhCalendar :size="18" weight="bold" />
          </div>
          <div>
            <span class="text-xs font-bold text-surface-500 uppercase tracking-wider block">Filter Periode</span>
            <span class="text-sm font-semibold text-surface-900 dark:text-surface-100">
              {{ getMonthName(selectedMonth) }} {{ selectedYear }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <!-- Month Navigation Step Arrows -->
          <div class="inline-flex items-center bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-1 shadow-xs">
            <button 
              type="button"
              @click="prevMonth"
              class="w-7 h-7 rounded-lg flex items-center justify-center text-surface-600 dark:text-surface-300 hover:bg-white dark:hover:bg-surface-800 hover:text-surface-900 transition-colors"
              title="Bulan Sebelumnya"
            >
              <PhCaretLeft :size="14" weight="bold" />
            </button>
            <button 
              type="button"
              @click="nextMonth"
              class="w-7 h-7 rounded-lg flex items-center justify-center text-surface-600 dark:text-surface-300 hover:bg-white dark:hover:bg-surface-800 hover:text-surface-900 transition-colors"
              title="Bulan Berikutnya"
            >
              <PhCaretRight :size="14" weight="bold" />
            </button>
          </div>

          <!-- Month Selector -->
          <select 
            v-model="selectedMonth" 
            class="px-3 py-2 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-xs font-semibold text-surface-800 dark:text-surface-200 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-brand-500 transition-all cursor-pointer"
          >
            <option v-for="m in MONTH_LIST" :key="m.value" :value="m.value">
              {{ m.label }}
            </option>
          </select>

          <!-- Year Selector -->
          <select 
            v-model="selectedYear" 
            class="px-3 py-2 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-xs font-semibold text-surface-800 dark:text-surface-200 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-brand-500 transition-all cursor-pointer"
          >
            <option v-for="y in YEAR_LIST" :key="y" :value="y">
              {{ y }}
            </option>
          </select>

          <!-- Reset to Current Month Shortcut -->
          <button 
            v-if="isNotCurrentMonth"
            @click="resetToCurrentMonth"
            class="px-2.5 py-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-lg transition-colors flex items-center gap-1"
          >
            <PhArrowCounterClockwise :size="12" weight="bold" />
            <span>Bulan Ini</span>
          </button>
        </div>
      </div>

      <!-- Expense Form Modal (Create & Edit) -->
      <ExpenseFormModal 
        v-model="showExpenseModal"
        :mode="modalMode"
        :expense-data="currentExpenseData"
        :property-name="activeProperty?.name"
        :categories="categories"
        :loading="submittingExpense"
        @save="handleSaveExpense"
        @open-category-creator="openCategoryCreatorFromForm"
        @delete-category="confirmDeleteCategory"
      />

      <!-- Custom Category Creator Dialog (Icon Picker) -->
      <Teleport to="body">
        <Transition name="modal">
          <div v-if="showAddCategoryModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div class="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-800 w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div class="px-5 py-4 border-b border-surface-100 dark:border-surface-800 flex justify-between items-center bg-surface-50/50 dark:bg-surface-900">
                <h4 class="font-bold text-surface-900 dark:text-surface-50">Buat Kategori Pengeluaran Baru</h4>
                <button @click="closeCategoryCreator" class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 p-1 rounded-lg">
                  <PhX :size="18" weight="bold" />
                </button>
              </div>

              <form @submit.prevent="submitNewCategory" class="p-5 space-y-4 overflow-y-auto">
                <!-- Name Input -->
                <div>
                  <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1.5">Nama Kategori</label>
                  <input 
                    type="text" 
                    v-model="newCategoryForm.name" 
                    placeholder="Contoh: Langganan CCTV, Servis Pompa..." 
                    required 
                    class="w-full px-3.5 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:bg-white dark:focus:bg-surface-800 focus:ring-2 focus:ring-slate-900 dark:focus:ring-brand-500 focus:border-slate-900 outline-none transition-all font-medium text-surface-900 dark:text-surface-100"
                  />
                </div>

                <!-- Color Palette -->
                <div>
                  <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1.5">Pilih Warna Tag</label>
                  <div class="flex flex-wrap gap-2">
                    <button 
                      v-for="color in AVAILABLE_COLORS" 
                      :key="color.class"
                      type="button"
                      @click="newCategoryForm.color = color.class"
                      class="w-7 h-7 rounded-full transition-all flex items-center justify-center"
                      :class="[
                        color.class,
                        newCategoryForm.color === color.class ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'opacity-80 hover:opacity-100'
                      ]"
                    >
                    </button>
                  </div>
                </div>

                <!-- Icon Picker Grid -->
                <div>
                  <div class="flex justify-between items-center mb-1.5">
                    <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider">Pilih Icon Tematik</label>
                    <span class="text-[11px] text-surface-500 font-medium">Pratinjau:</span>
                  </div>

                  <div class="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl scrollbar-thin">
                    <button 
                      v-for="iconItem in AVAILABLE_ICONS" 
                      :key="iconItem.key"
                      type="button"
                      @click="newCategoryForm.icon = iconItem.key"
                      :title="iconItem.label"
                      class="aspect-square flex flex-col items-center justify-center rounded-lg border transition-all text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-50"
                      :class="[
                        newCategoryForm.icon === iconItem.key 
                          ? 'border-slate-900 dark:border-brand-500 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 shadow-xs ring-2 ring-slate-900/10' 
                          : 'border-transparent hover:bg-white dark:hover:bg-surface-700'
                      ]"
                    >
                      <component :is="getIconComponent(iconItem.key)" :size="20" weight="fill" />
                    </button>
                  </div>
                </div>

                <!-- Live Preview Card -->
                <div class="p-3 bg-surface-100/70 dark:bg-surface-800/60 rounded-xl flex items-center gap-3">
                  <div :class="newCategoryForm.color" class="w-9 h-9 rounded-lg text-white flex items-center justify-center shadow-xs flex-shrink-0">
                    <component :is="getIconComponent(newCategoryForm.icon)" :size="20" weight="fill" />
                  </div>
                  <div class="overflow-hidden">
                    <p class="text-xs text-surface-500 font-medium">Tampilan Kategori</p>
                    <p class="text-sm font-bold text-surface-900 dark:text-surface-50 truncate">{{ newCategoryForm.name || 'Nama Kategori Baru' }}</p>
                  </div>
                </div>

                <div class="pt-2 flex justify-end gap-2">
                  <button type="button" @click="closeCategoryCreator" class="px-4 py-2 text-xs font-semibold text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors">
                    Batal
                  </button>
                  <button type="submit" :disabled="savingCategory" class="px-5 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-brand-600 hover:bg-slate-800 dark:hover:bg-brand-700 rounded-lg transition-colors shadow-xs disabled:opacity-50">
                    <span v-if="savingCategory">Menyimpan...</span>
                    <span v-else>Simpan Kategori</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Expenses History Table -->
      <phantom-ui :loading="pending">
        <div class="bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-700 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-surface-50/80 dark:bg-surface-900/50 border-b border-surface-200 dark:border-surface-700">
                  <th v-if="!activeProperty" class="p-4 pl-6 text-xs font-semibold text-surface-500 uppercase tracking-wider whitespace-nowrap">Properti</th>
                  <th class="p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider whitespace-nowrap" :class="{'pl-6': activeProperty}">Tanggal</th>
                  <th class="p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider whitespace-nowrap">Kategori</th>
                  <th class="p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Deskripsi</th>
                  <th class="p-4 text-xs font-semibold text-surface-500 uppercase tracking-wider whitespace-nowrap text-right">Nominal</th>
                  <th class="p-4 pr-6 text-xs font-semibold text-surface-500 uppercase tracking-wider whitespace-nowrap text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-surface-100 dark:divide-surface-700/50">
                <template v-if="pending">
                  <tr v-for="i in 5" :key="'skel-'+i" class="animate-pulse">
                    <td v-if="!activeProperty" class="p-4 pl-6"><div class="h-4 bg-surface-200 dark:bg-surface-700 rounded w-24"></div></td>
                    <td class="p-4" :class="{'pl-6': activeProperty}"><div class="h-4 bg-surface-200 dark:bg-surface-700 rounded w-20"></div></td>
                    <td class="p-4">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-surface-200 dark:bg-surface-700 flex-shrink-0"></div>
                        <div class="h-4 bg-surface-200 dark:bg-surface-700 rounded w-20"></div>
                      </div>
                    </td>
                    <td class="p-4"><div class="h-4 bg-surface-200 dark:bg-surface-700 rounded w-48"></div></td>
                    <td class="p-4 text-right"><div class="h-4 bg-surface-200 dark:bg-surface-700 rounded w-24 ml-auto"></div></td>
                    <td class="p-4 pr-6 text-right"><div class="h-4 bg-surface-200 dark:bg-surface-700 rounded w-16 ml-auto"></div></td>
                  </tr>
                </template>
                <tr v-else-if="!expenses?.data?.length">
                  <td colspan="6" class="p-12 text-center">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-700 mb-4">
                      <PhReceipt :size="32" class="text-surface-400" />
                    </div>
                    <h3 class="text-surface-900 dark:text-surface-100 font-medium mb-1">Belum ada pengeluaran di periode ini</h3>
                    <p class="text-surface-500 text-sm">Tidak ada catatan pengeluaran pada {{ getMonthName(selectedMonth) }} {{ selectedYear }}.</p>
                  </td>
                </tr>
                <template v-else>
                  <tr v-for="exp in expenses.data" :key="exp.id" class="group hover:bg-surface-50/80 dark:hover:bg-surface-700/30 transition-colors">
                    <td v-if="!activeProperty" class="p-4 pl-6 text-sm font-medium text-surface-900 dark:text-surface-100 whitespace-nowrap">{{ exp.property?.name || '-' }}</td>
                    <td class="p-4 text-sm text-surface-600 dark:text-surface-300 whitespace-nowrap" :class="{'pl-6': activeProperty}">{{ new Date(exp.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) }}</td>
                    <td class="p-4">
                      <div class="flex items-center gap-3">
                        <div :class="getCategoryConfig(exp.category).color" class="p-2 rounded-lg text-white flex-shrink-0 shadow-xs">
                          <component :is="getCategoryConfig(exp.category).iconComponent" :size="16" weight="fill" />
                        </div>
                        <span class="font-semibold text-sm text-surface-900 dark:text-surface-100">{{ exp.category }}</span>
                      </div>
                    </td>
                    <td class="p-4 text-sm text-surface-600 dark:text-surface-300 max-w-xs truncate">{{ exp.description || '-' }}</td>
                    <td class="p-4 text-right whitespace-nowrap">
                      <span class="font-bold text-sm text-surface-900 dark:text-surface-50">Rp {{ Number(exp.amount).toLocaleString('id-ID') }}</span>
                    </td>
                    <td class="p-4 pr-6 text-right whitespace-nowrap">
                      <div class="inline-flex items-center gap-1.5">
                        <button 
                          v-if="activeProperty"
                          @click="openEditModal(exp)" 
                          class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors" 
                          title="Edit Pengeluaran"
                        >
                          <PhPencilSimple :size="18" />
                        </button>
                        <button 
                          v-if="activeProperty"
                          @click="confirmDeleteExpense(exp)" 
                          class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-surface-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors" 
                          title="Hapus Pengeluaran"
                        >
                          <PhTrashSimple :size="18" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
      </phantom-ui>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePropertyState } from '~/composables/usePropertyState'
import { useToast } from '~/composables/useToast'
import { useConfirm } from '~/composables/useConfirm'
import { computed, watch, ref, onMounted } from 'vue'
import {
  // Phosphor Icons for Categories
  PhLightning,
  PhDrop,
  PhTrash,
  PhUserCheck,
  PhReceipt,
  PhHandHeart,
  PhUsersThree,
  PhWrench,
  PhCoins,
  PhWifiHigh,
  PhBroom,
  PhBuildings,
  PhHouse,
  PhBed,
  PhDoor,
  PhKey,
  PhPaintBrush,
  PhHammer,
  PhThermometer,
  PhVideoCamera,
  PhShieldCheck,
  PhCreditCard,
  PhFileText,
  PhScales,
  PhHeart,
  PhCar,
  PhGasPump,
  PhTelevision,
  PhFirstAid,
  PhSparkle,
  PhTag,
  
  // UI Action Icons
  PhPlus,
  PhX,
  PhTrashSimple,
  PhPencilSimple,
  PhCalendar,
  PhCaretLeft,
  PhCaretRight,
  PhArrowCounterClockwise
} from '@phosphor-icons/vue'

definePageMeta({
  layout: 'dashboard',
})

const { activePropertyId, activeProperty } = usePropertyState()
const { addToast } = useToast()
const { confirm } = useConfirm()

// Date filter states (default to current month and year)
const todayDate = new Date()
const selectedMonth = ref(todayDate.getMonth() + 1) // 1-12
const selectedYear = ref(todayDate.getFullYear())   // e.g. 2026

const MONTH_LIST = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' }
]

const YEAR_LIST = [2024, 2025, 2026, 2027, 2028]

function getMonthName(m: number) {
  return MONTH_LIST.find(item => item.value === Number(m))?.label || 'Bulan'
}

const isNotCurrentMonth = computed(() => {
  return selectedMonth.value !== (todayDate.getMonth() + 1) || selectedYear.value !== todayDate.getFullYear()
})

function resetToCurrentMonth() {
  selectedMonth.value = todayDate.getMonth() + 1
  selectedYear.value = todayDate.getFullYear()
}

function prevMonth() {
  if (selectedMonth.value === 1) {
    selectedMonth.value = 12
    selectedYear.value -= 1
  } else {
    selectedMonth.value -= 1
  }
}

function nextMonth() {
  if (selectedMonth.value === 12) {
    selectedMonth.value = 1
    selectedYear.value += 1
  } else {
    selectedMonth.value += 1
  }
}

// Modal States
const showExpenseModal = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const currentExpenseData = ref<any>(null)
const submittingExpense = ref(false)

const showAddCategoryModal = ref(false)
const returnToExpenseForm = ref(false)
const savingCategory = ref(false)

const newCategoryForm = ref({
  name: '',
  icon: 'PhTag',
  color: 'bg-indigo-500'
})

const categories = ref<any[]>([])
const expenses = ref<{ data: any[] }>({ data: [] })
const pending = ref(false)

const totalExpenses = computed(() => {
  return expenses.value.data.reduce((sum, exp) => sum + Number(exp.amount), 0)
})

// Phosphor Icon Mapping Dictionary
const ICON_COMPONENTS: Record<string, any> = {
  PhLightning,
  PhDrop,
  PhTrash,
  PhUserCheck,
  PhReceipt,
  PhHandHeart,
  PhUsersThree,
  PhWrench,
  PhCoins,
  PhWifiHigh,
  PhBroom,
  PhBuildings,
  PhHouse,
  PhBed,
  PhDoor,
  PhKey,
  PhPaintBrush,
  PhHammer,
  PhThermometer,
  PhVideoCamera,
  PhShieldCheck,
  PhCreditCard,
  PhFileText,
  PhScales,
  PhHeart,
  PhCar,
  PhGasPump,
  PhTelevision,
  PhFirstAid,
  PhSparkle,
  PhTag
}

// Curated List of Icons for Property Management
const AVAILABLE_ICONS = [
  { key: 'PhLightning', label: 'Listrik / Token' },
  { key: 'PhDrop', label: 'Air / PDAM' },
  { key: 'PhWifiHigh', label: 'Internet / Wifi' },
  { key: 'PhGasPump', label: 'Gas Elpiji' },
  { key: 'PhTrash', label: 'Iuran Sampah' },
  { key: 'PhBroom', label: 'Kebersihan' },
  { key: 'PhWrench', label: 'Perkakas' },
  { key: 'PhHammer', label: 'Tukang Renovasi' },
  { key: 'PhPaintBrush', label: 'Cat Dinding' },
  { key: 'PhThermometer', label: 'AC / Suhu' },
  { key: 'PhBed', label: 'Kasur & Mebel' },
  { key: 'PhDoor', label: 'Kamar / Pintu' },
  { key: 'PhKey', label: 'Kunci / Akses' },
  { key: 'PhTelevision', label: 'Elektronik / TV' },
  { key: 'PhVideoCamera', label: 'CCTV' },
  { key: 'PhShieldCheck', label: 'Keamanan / Satpam' },
  { key: 'PhUserCheck', label: 'Gaji / Honor' },
  { key: 'PhReceipt', label: 'Pajak PBB' },
  { key: 'PhCoins', label: 'Komisi Agen' },
  { key: 'PhCreditCard', label: 'Transfer Bank' },
  { key: 'PhHandHeart', label: 'Zakat & Infaq' },
  { key: 'PhUsersThree', label: 'Santunan Yatim' },
  { key: 'PhCar', label: 'Parkir / Kendaraan' },
  { key: 'PhFirstAid', label: 'P3K / Obat' },
  { key: 'PhBuildings', label: 'Gedung Kos' },
  { key: 'PhSparkle', label: 'Lain-lain' },
  { key: 'PhTag', label: 'Umum' }
]

// Modern Tailwind Color Swatches
const AVAILABLE_COLORS = [
  { class: 'bg-amber-500', label: 'Amber' },
  { class: 'bg-blue-500', label: 'Blue' },
  { class: 'bg-emerald-500', label: 'Emerald' },
  { class: 'bg-violet-500', label: 'Violet' },
  { class: 'bg-indigo-500', label: 'Indigo' },
  { class: 'bg-teal-500', label: 'Teal' },
  { class: 'bg-pink-500', label: 'Pink' },
  { class: 'bg-rose-500', label: 'Rose' },
  { class: 'bg-orange-500', label: 'Orange' },
  { class: 'bg-cyan-500', label: 'Cyan' },
  { class: 'bg-slate-700', label: 'Slate' }
]

function getIconComponent(iconName: string) {
  return ICON_COMPONENTS[iconName] || PhTag
}

function getCategoryConfig(categoryName: string) {
  const found = categories.value.find(c => c.name === categoryName)
  if (found) {
    return {
      iconComponent: getIconComponent(found.icon),
      color: found.color || 'bg-slate-700'
    }
  }
  return {
    iconComponent: PhTag,
    color: 'bg-slate-700'
  }
}

// Fetch categories from API
async function fetchCategories() {
  try {
    const res = await $fetch<any>('/api/expenses/categories')
    if (res.status === 'success') {
      categories.value = res.data || []
    }
  } catch (e) {
    console.error('Gagal mengambil kategori:', e)
  }
}

// Open modal in Create mode
function openCreateModal() {
  modalMode.value = 'create'
  currentExpenseData.value = null
  showExpenseModal.value = true
}

// Open modal in Edit mode
function openEditModal(exp: any) {
  modalMode.value = 'edit'
  currentExpenseData.value = { ...exp }
  showExpenseModal.value = true
}

// Handle Save Expense (both Create and Edit)
async function handleSaveExpense(payload: { id?: string; date: string; category: string; amount: string | number; description: string }) {
  if (!activeProperty.value) return

  try {
    submittingExpense.value = true

    if (modalMode.value === 'edit' && payload.id) {
      await $fetch(`/api/expenses/${payload.id}`, {
        method: 'PATCH',
        body: {
          date: payload.date,
          category: payload.category,
          amount: payload.amount,
          description: payload.description
        }
      })
      addToast('Berhasil', 'Data pengeluaran berhasil diperbarui.', 'success')
    } else {
      await $fetch('/api/expenses', {
        method: 'POST',
        body: {
          propertyId: activeProperty.value.id,
          date: payload.date,
          category: payload.category,
          amount: payload.amount,
          description: payload.description
        }
      })
      addToast('Berhasil', 'Pengeluaran baru telah dicatat.', 'success')
    }

    showExpenseModal.value = false
    await fetchExpenses()
  } catch (e: any) {
    addToast('Gagal', e.data?.statusMessage || 'Gagal menyimpan pengeluaran.', 'error')
  } finally {
    submittingExpense.value = false
  }
}

// Category creator handlers
function openCategoryCreatorStandalone() {
  returnToExpenseForm.value = false
  showAddCategoryModal.value = true
}

function openCategoryCreatorFromForm() {
  showExpenseModal.value = false
  returnToExpenseForm.value = true
  setTimeout(() => {
    showAddCategoryModal.value = true
  }, 250)
}

function closeCategoryCreator() {
  showAddCategoryModal.value = false
  if (returnToExpenseForm.value) {
    setTimeout(() => {
      showExpenseModal.value = true
      returnToExpenseForm.value = false
    }, 250)
  }
}

async function submitNewCategory() {
  if (!newCategoryForm.value.name.trim()) return
  try {
    savingCategory.value = true
    await $fetch<any>('/api/expenses/categories', {
      method: 'POST',
      body: {
        name: newCategoryForm.value.name.trim(),
        icon: newCategoryForm.value.icon,
        color: newCategoryForm.value.color
      }
    })
    
    addToast('Berhasil', 'Kategori custom baru berhasil dibuat.', 'success')
    await fetchCategories()
    
    // Reset and close creator modal
    newCategoryForm.value = {
      name: '',
      icon: 'PhTag',
      color: 'bg-indigo-500'
    }
    closeCategoryCreator()
  } catch (e: any) {
    addToast('Gagal', e.data?.statusMessage || 'Gagal membuat kategori baru.', 'error')
  } finally {
    savingCategory.value = false
  }
}

async function confirmDeleteCategory(cat: any) {
  const isConfirmed = await confirm({
    title: 'Hapus Kategori',
    message: `Hapus kategori '${cat.name}'? Kategori yang sudah dihapus tidak dapat dikembalikan.`,
    confirmText: 'Ya, Hapus',
    cancelText: 'Batal',
    type: 'danger'
  })

  if (!isConfirmed) return

  try {
    await $fetch(`/api/expenses/categories/${cat.id}`, {
      method: 'DELETE'
    })
    addToast('Berhasil', `Kategori '${cat.name}' telah dihapus.`, 'success')
    await fetchCategories()
  } catch (e: any) {
    addToast('Gagal', e.data?.statusMessage || 'Gagal menghapus kategori.', 'error')
  }
}

// Fetch list of expenses with reactive month & year filtering
const fetchExpenses = async () => {
  pending.value = true
  try {
    const params = new URLSearchParams()
    if (activePropertyId.value) params.append('propertyId', activePropertyId.value)
    if (selectedMonth.value) params.append('month', String(selectedMonth.value))
    if (selectedYear.value) params.append('year', String(selectedYear.value))

    const queryStr = params.toString() ? `?${params.toString()}` : ''
    const res = await $fetch<any>(`/api/expenses${queryStr}`)
    if (res.status === 'success') {
      expenses.value.data = res.data?.data || res.data || []
    }
  } catch (err) {
    addToast('Gagal', 'Terjadi kesalahan saat mengambil data pengeluaran.', 'error')
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  fetchCategories()
})

watch([activePropertyId, selectedMonth, selectedYear], () => {
  fetchExpenses()
}, { immediate: true })

async function confirmDeleteExpense(exp: any) {
  const isConfirmed = await confirm({
    title: 'Hapus Pengeluaran',
    message: `Hapus catatan pengeluaran ${exp.category} sebesar Rp ${Number(exp.amount).toLocaleString('id-ID')}? Tindakan ini tidak dapat dibatalkan.`,
    confirmText: 'Ya, Hapus',
    cancelText: 'Batal',
    type: 'danger'
  })

  if (!isConfirmed) return

  try {
    await $fetch(`/api/expenses/${exp.id}`, {
      method: 'DELETE'
    })
    addToast('Dihapus', 'Data pengeluaran berhasil dihapus.', 'success')
    await fetchExpenses()
  } catch (e: any) {
    addToast('Gagal', e.data?.statusMessage || 'Gagal menghapus pengeluaran.', 'error')
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-enter-from > div {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
.modal-leave-to > div {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>
