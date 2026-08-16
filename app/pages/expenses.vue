<template>
  <div>
    <!-- Global View Banner -->
    <div v-if="!activeProperty" class="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 mb-8 flex items-center gap-3">
      <div class="flex-1">
        <h2 class="font-bold text-sm">Mode Global View Aktif</h2>
        <p class="text-xs">Menampilkan seluruh pengeluaran dari semua properti. Pilih properti spesifik di menu atas untuk mencatat pengeluaran baru.</p>
      </div>
    </div>

    <div>
      <!-- Header & Quick Stats -->
      <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight font-outfit">Pengeluaran Operasional</h1>
          <p class="text-sm text-slate-500 mt-1">Kelola dan pantau seluruh pengeluaran operasional properti Anda.</p>
        </div>
        
        <div class="flex items-center gap-4">
          <!-- Quick Stats -->
          <div class="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Bulan Ini</span>
            <span class="text-lg font-bold text-rose-600">Rp {{ totalExpenses.toLocaleString('id-ID') }}</span>
          </div>
          
          <button v-if="activeProperty" @click="openExpenseModal" class="bg-slate-900 text-white px-5 py-3.5 rounded-xl font-medium hover:bg-slate-800 transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2">
            <PhPlus :size="18" weight="bold" />
            Catat Pengeluaran
          </button>
        </div>
      </div>

      <!-- Main Expense Modal -->
      <Transition name="modal">
        <div v-if="showForm" class="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6 bg-slate-900/50 backdrop-blur-sm">
          <div class="bg-white rounded-t-[1.5rem] md:rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all mt-auto md:mt-0">
            
            <!-- Mobile Handle -->
            <div class="w-full flex justify-center pt-3 pb-1 md:hidden bg-white">
              <div class="w-12 h-1.5 bg-slate-200 rounded-full"></div>
            </div>
            
            <!-- Modal Header -->
            <div class="flex-shrink-0 px-4 md:px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <div>
                <h3 class="text-lg font-bold text-slate-900">Catat Pengeluaran Baru</h3>
                <p class="text-xs text-slate-500">Properti: <span class="font-semibold text-slate-700">{{ activeProperty?.name }}</span></p>
              </div>
              <button @click="showForm = false" class="text-slate-400 hover:text-slate-600 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100">
                <PhX :size="20" weight="bold" />
              </button>
            </div>
            
            <form @submit.prevent="submitForm" class="flex flex-col min-h-0 flex-1">
              <!-- Scrollable Body -->
              <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-1.5">Tanggal</label>
                  <input type="date" v-model="form.date" required class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-sm">
                </div>

                <div>
                  <div class="flex justify-between items-center mb-2">
                    <label class="block text-sm font-semibold text-slate-700">Kategori Pengeluaran</label>
                    <span class="text-xs text-slate-400">Pilih salah satu atau buat baru</span>
                  </div>
                  
                  <!-- Category Grid -->
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1 p-0.5">
                    <div 
                      v-for="cat in categories" 
                      :key="cat.id || cat.name"
                      class="relative group"
                    >
                      <button 
                        type="button"
                        @click="selectCategory(cat.name)"
                        class="w-full h-full flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all text-center relative overflow-hidden"
                        :class="[
                          form.category === cat.name 
                            ? 'border-slate-900 bg-slate-900 text-white shadow-md ring-2 ring-slate-900/10' 
                            : 'border-slate-100 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                        ]"
                      >
                        <div 
                          class="w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 transition-colors"
                          :class="form.category === cat.name ? 'bg-white/20 text-white' : `${cat.color} text-white shadow-xs`"
                        >
                          <component :is="getIconComponent(cat.icon)" :size="18" weight="fill" />
                        </div>
                        <span class="text-xs font-semibold line-clamp-2 leading-snug">{{ cat.name }}</span>
                      </button>

                      <!-- Delete Custom Category Button -->
                      <button 
                        v-if="cat.isSystem === 0" 
                        type="button"
                        @click.stop="confirmDeleteCategory(cat)"
                        title="Hapus kategori custom ini"
                        class="absolute -top-1.5 -right-1.5 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-600 transition-transform active:scale-90 opacity-80 hover:opacity-100 z-10"
                      >
                        <PhX :size="12" weight="bold" />
                      </button>
                    </div>

                    <!-- Add Custom Category Button -->
                    <button 
                      type="button"
                      @click="showAddCategoryModal = true"
                      class="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 text-blue-700 hover:bg-blue-100/70 hover:border-blue-400 transition-all text-center group min-h-[82px]"
                    >
                      <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                        <PhPlus :size="18" weight="bold" />
                      </div>
                      <span class="text-xs font-bold">+ Kategori Baru</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-1.5">Nominal (Rp)</label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span class="text-slate-500 font-medium">Rp</span>
                    </div>
                    <input type="number" v-model="form.amount" required min="0" placeholder="0" class="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all font-semibold text-slate-900">
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-1.5">Deskripsi</label>
                  <textarea v-model="form.description" rows="2" placeholder="Catatan tambahan seperti nama toko, nomor struk, dsb. (opsional)" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all resize-none text-sm"></textarea>
                </div>
              </div>

              <!-- Modal Footer -->
              <div class="flex-shrink-0 px-4 md:px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3 bg-slate-50/50">
                <button type="button" @click="showForm = false" class="w-full sm:w-auto px-5 py-2.5 min-h-[44px] text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">
                  Batal
                </button>
                <button type="submit" :disabled="loading" class="w-full sm:w-auto px-6 py-2.5 min-h-[44px] text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-sm hover:shadow">
                  <span v-if="loading" class="flex items-center gap-2">
                    <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Menyimpan...
                  </span>
                  <span v-else>Simpan Pengeluaran</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>

      <!-- Custom Category Creator Dialog (Icon Picker) -->
      <Transition name="modal">
        <div v-if="showAddCategoryModal" class="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div class="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h4 class="font-bold text-slate-900">Buat Kategori Pengeluaran Baru</h4>
              <button @click="showAddCategoryModal = false" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <PhX :size="18" weight="bold" />
              </button>
            </div>

            <form @submit.prevent="submitNewCategory" class="p-5 space-y-4 overflow-y-auto">
              <!-- Name Input -->
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Nama Kategori</label>
                <input 
                  type="text" 
                  v-model="newCategoryForm.name" 
                  placeholder="Contoh: Langganan CCTV, Servis Pompa..." 
                  required 
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all font-medium"
                />
              </div>

              <!-- Color Palette -->
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Pilih Warna Tag</label>
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
                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">Pilih Icon Tematik</label>
                  <span class="text-[11px] text-slate-500 font-medium">Pratinjau:</span>
                </div>

                <div class="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  <button 
                    v-for="iconItem in AVAILABLE_ICONS" 
                    :key="iconItem.key"
                    type="button"
                    @click="newCategoryForm.icon = iconItem.key"
                    :title="iconItem.label"
                    class="aspect-square flex flex-col items-center justify-center rounded-lg border transition-all text-slate-600 hover:text-slate-900"
                    :class="[
                      newCategoryForm.icon === iconItem.key 
                        ? 'border-slate-900 bg-white text-slate-900 shadow-xs ring-2 ring-slate-900/10' 
                        : 'border-transparent hover:bg-white'
                    ]"
                  >
                    <component :is="getIconComponent(iconItem.key)" :size="20" weight="fill" />
                  </button>
                </div>
              </div>

              <!-- Live Preview Card -->
              <div class="p-3 bg-slate-100/70 rounded-xl flex items-center gap-3">
                <div :class="newCategoryForm.color" class="w-9 h-9 rounded-lg text-white flex items-center justify-center shadow-xs flex-shrink-0">
                  <component :is="getIconComponent(newCategoryForm.icon)" :size="20" weight="fill" />
                </div>
                <div class="overflow-hidden">
                  <p class="text-xs text-slate-500 font-medium">Tampilan Kategori</p>
                  <p class="text-sm font-bold text-slate-900 truncate">{{ newCategoryForm.name || 'Nama Kategori Baru' }}</p>
                </div>
              </div>

              <div class="pt-2 flex justify-end gap-2">
                <button type="button" @click="showAddCategoryModal = false" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Batal
                </button>
                <button type="submit" :disabled="savingCategory" class="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs disabled:opacity-50">
                  <span v-if="savingCategory">Menyimpan...</span>
                  <span v-else>Simpan Kategori</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>

      <!-- Expenses History Table -->
      <phantom-ui :loading="pending">
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50/80">
                  <th v-if="!activeProperty" class="p-4 pl-6 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Properti</th>
                  <th class="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap" :class="{'pl-6': activeProperty}">Tanggal</th>
                  <th class="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Kategori</th>
                  <th class="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Deskripsi</th>
                  <th class="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap text-right">Nominal</th>
                  <th class="p-4 pr-6 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <template v-if="pending">
                  <tr v-for="i in 5" :key="'skel-'+i" class="animate-pulse">
                    <td v-if="!activeProperty" class="p-4 pl-6"><div class="h-4 bg-slate-200 rounded w-24"></div></td>
                    <td class="p-4" :class="{'pl-6': activeProperty}"><div class="h-4 bg-slate-200 rounded w-20"></div></td>
                    <td class="p-4">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-slate-200 flex-shrink-0"></div>
                        <div class="h-4 bg-slate-200 rounded w-20"></div>
                      </div>
                    </td>
                    <td class="p-4"><div class="h-4 bg-slate-200 rounded w-48"></div></td>
                    <td class="p-4 text-right"><div class="h-4 bg-slate-200 rounded w-24 ml-auto"></div></td>
                    <td class="p-4 pr-6 text-right"><div class="h-4 bg-slate-200 rounded w-8 ml-auto"></div></td>
                  </tr>
                </template>
                <tr v-else-if="!expenses?.data?.length">
                  <td colspan="6" class="p-12 text-center">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                      <PhReceipt :size="32" class="text-slate-400" />
                    </div>
                    <h3 class="text-slate-900 font-medium mb-1">Belum ada pengeluaran</h3>
                    <p class="text-slate-500 text-sm">Mulai catat pengeluaran operasional properti Anda.</p>
                  </td>
                </tr>
                <template v-else>
                  <tr v-for="exp in expenses.data" :key="exp.id" class="group hover:bg-slate-50/80 transition-colors">
                    <td v-if="!activeProperty" class="p-4 pl-6 text-sm font-medium text-slate-900 whitespace-nowrap">{{ exp.property?.name || '-' }}</td>
                    <td class="p-4 text-sm text-slate-600 whitespace-nowrap" :class="{'pl-6': activeProperty}">{{ new Date(exp.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) }}</td>
                    <td class="p-4">
                      <div class="flex items-center gap-3">
                        <div :class="getCategoryConfig(exp.category).color" class="p-2 rounded-lg text-white flex-shrink-0 shadow-xs">
                          <component :is="getCategoryConfig(exp.category).iconComponent" :size="16" weight="fill" />
                        </div>
                        <span class="font-semibold text-sm text-slate-900">{{ exp.category }}</span>
                      </div>
                    </td>
                    <td class="p-4 text-sm text-slate-600 max-w-xs truncate">{{ exp.description || '-' }}</td>
                    <td class="p-4 text-right whitespace-nowrap">
                      <span class="font-bold text-sm text-slate-900">Rp {{ Number(exp.amount).toLocaleString('id-ID') }}</span>
                    </td>
                    <td class="p-4 pr-6 text-right whitespace-nowrap">
                      <button @click="deleteExpense(exp.id)" class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Hapus Pengeluaran">
                        <PhTrashSimple :size="18" />
                      </button>
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
  PhTrashSimple
} from '@phosphor-icons/vue'

definePageMeta({
  layout: 'dashboard',
})

const { activePropertyId, activeProperty } = usePropertyState()
const { addToast } = useToast()

const showForm = ref(false)
const showAddCategoryModal = ref(false)
const loading = ref(false)
const savingCategory = ref(false)

const form = ref({
  date: new Date().toISOString().split('T')[0],
  category: 'Listrik & Daya (PLN)',
  amount: '',
  description: ''
})

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

function selectCategory(name: string) {
  form.value.category = name
}

function openExpenseModal() {
  showForm.value = true
  if (categories.value.length > 0 && !form.value.category) {
    form.value.category = categories.value[0].name
  }
}

// Fetch categories from API
async function fetchCategories() {
  try {
    const res = await $fetch<any>('/api/expenses/categories')
    if (res.status === 'success') {
      categories.value = res.data || []
      if (!form.value.category && categories.value.length > 0) {
        form.value.category = categories.value[0].name
      }
    }
  } catch (e) {
    console.error('Gagal mengambil kategori:', e)
  }
}

// Submit a new custom category
async function submitNewCategory() {
  if (!newCategoryForm.value.name.trim()) return
  try {
    savingCategory.value = true
    const res = await $fetch<any>('/api/expenses/categories', {
      method: 'POST',
      body: {
        name: newCategoryForm.value.name.trim(),
        icon: newCategoryForm.value.icon,
        color: newCategoryForm.value.color
      }
    })
    
    addToast('Berhasil', 'Kategori custom baru berhasil dibuat.', 'success')
    await fetchCategories()
    
    // Auto-select the newly created category
    form.value.category = newCategoryForm.value.name.trim()
    
    // Reset and close creator modal
    newCategoryForm.value = {
      name: '',
      icon: 'PhTag',
      color: 'bg-indigo-500'
    }
    showAddCategoryModal.value = false
  } catch (e: any) {
    addToast('Gagal', e.data?.statusMessage || 'Gagal membuat kategori baru.', 'error')
  } finally {
    savingCategory.value = false
  }
}

// Delete custom category
async function confirmDeleteCategory(cat: any) {
  if (!confirm(`Hapus kategori '${cat.name}'? Kategori yang sudah dihapus tidak dapat dikembalikan.`)) return
  try {
    await $fetch(`/api/expenses/categories/${cat.id}`, {
      method: 'DELETE'
    })
    addToast('Berhasil', `Kategori '${cat.name}' telah dihapus.`, 'success')
    await fetchCategories()
    if (form.value.category === cat.name && categories.value.length > 0) {
      form.value.category = categories.value[0].name
    }
  } catch (e: any) {
    addToast('Gagal', e.data?.statusMessage || 'Gagal menghapus kategori.', 'error')
  }
}

// Fetch list of expenses
const fetchExpenses = async () => {
  pending.value = true
  try {
    const query = activePropertyId.value ? `?propertyId=${activePropertyId.value}` : ''
    const res = await $fetch<any>(`/api/expenses${query}`)
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

watch(activePropertyId, () => {
  fetchExpenses()
}, { immediate: true })

async function submitForm() {
  if (!activeProperty.value) return
  
  if (!form.value.category) {
    addToast('Kategori Kosong', 'Silakan pilih kategori pengeluaran.', 'error')
    return
  }

  try {
    loading.value = true

    await $fetch('/api/expenses', {
      method: 'POST',
      body: {
        propertyId: activeProperty.value.id,
        date: form.value.date,
        category: form.value.category,
        amount: form.value.amount,
        description: form.value.description
      }
    })

    showForm.value = false
    
    // Reset Form
    form.value = {
      date: new Date().toISOString().split('T')[0],
      category: categories.value[0]?.name || 'Listrik & Daya (PLN)',
      amount: '',
      description: ''
    }
    
    addToast('Berhasil', 'Pengeluaran baru telah dicatat.', 'success')
    await fetchExpenses()
  } catch (e: any) {
    addToast('Gagal', e.data?.statusMessage || 'Gagal menyimpan pengeluaran.', 'error')
  } finally {
    loading.value = false
  }
}

async function deleteExpense(id: string) {
  if (!confirm('Hapus data pengeluaran ini secara permanen?')) return
  try {
    await $fetch(`/api/expenses/${id}`, {
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

.modal-enter-active .transform,
.modal-leave-active .transform {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.modal-enter-from .transform,
.modal-leave-to .transform {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>
