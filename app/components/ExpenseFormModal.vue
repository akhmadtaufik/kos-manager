<template>
  <Teleport to="body">
    <Transition name="modal">
      <div 
        v-if="modelValue" 
        class="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6 bg-slate-950/60 backdrop-blur-sm"
        @click.self="closeModal"
      >
        <div class="bg-white dark:bg-surface-900 rounded-t-[1.5rem] md:rounded-2xl shadow-2xl border border-surface-200/80 dark:border-surface-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all mt-auto md:mt-0">
          
          <!-- Mobile Handle Bar -->
          <div class="w-full flex justify-center pt-3 pb-1 md:hidden bg-white dark:bg-surface-900">
            <div class="w-12 h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full"></div>
          </div>
          
          <!-- Modal Header -->
          <div class="flex-shrink-0 px-5 md:px-6 py-4 border-b border-surface-100 dark:border-surface-800 flex justify-between items-center bg-surface-50/50 dark:bg-surface-900">
            <div>
              <h3 class="text-lg font-bold text-surface-900 dark:text-surface-50 tracking-tight">
                {{ mode === 'edit' ? 'Edit Pengeluaran' : 'Catat Pengeluaran Baru' }}
              </h3>
              <p class="text-xs text-surface-500 mt-0.5">
                Properti: <span class="font-semibold text-surface-700 dark:text-surface-300">{{ propertyName || 'Semua Properti' }}</span>
              </p>
            </div>
            <button 
              @click="closeModal" 
              class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors w-9 h-9 flex items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700"
            >
              <PhX :size="18" weight="bold" />
            </button>
          </div>
          
          <!-- Modal Form -->
          <form @submit.prevent="handleSubmit" class="flex flex-col min-h-0 flex-1">
            <!-- Scrollable Body -->
            <div class="flex-1 overflow-y-auto px-5 md:px-6 py-5 space-y-5">
              <!-- Date Input -->
              <div>
                <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1.5">
                  Tanggal Transaksi
                </label>
                <input 
                  type="date" 
                  v-model="form.date" 
                  required 
                  class="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl focus:bg-white dark:focus:bg-surface-800 focus:ring-2 focus:ring-slate-900 dark:focus:ring-brand-500 focus:border-slate-900 outline-none transition-all text-sm font-medium text-surface-900 dark:text-surface-100"
                >
              </div>

              <!-- Category Grid Selector -->
              <div>
                <div class="flex justify-between items-center mb-2">
                  <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider">
                    Kategori Pengeluaran
                  </label>
                  <span class="text-xs text-surface-400">Pilih salah satu</span>
                </div>
                
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1 p-0.5 scrollbar-thin">
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
                          ? 'border-slate-900 bg-slate-900 text-white shadow-md ring-2 ring-slate-900/10 dark:border-brand-500 dark:bg-brand-600' 
                          : 'border-surface-200/80 bg-surface-50 dark:bg-surface-800 dark:border-surface-700 text-surface-700 dark:text-surface-200 hover:border-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700'
                      ]"
                    >
                      <div 
                        class="w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 transition-colors"
                        :class="form.category === cat.name ? 'bg-white/20 text-white' : `${cat.color || 'bg-slate-700'} text-white shadow-xs`"
                      >
                        <component :is="getIconComponent(cat.icon)" :size="18" weight="fill" />
                      </div>
                      <span class="text-xs font-semibold line-clamp-2 leading-snug">{{ cat.name }}</span>
                    </button>

                    <!-- Delete Custom Category Button -->
                    <button 
                      v-if="cat.isSystem === 0" 
                      type="button"
                      @click.stop="handleDeleteCategory(cat)"
                      title="Hapus kategori custom ini"
                      class="absolute -top-1.5 -right-1.5 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-600 transition-transform active:scale-90 opacity-80 hover:opacity-100 z-10"
                    >
                      <PhX :size="12" weight="bold" />
                    </button>

                  </div>

                  <!-- Add Custom Category Button -->
                  <button 
                    type="button"
                    @click="$emit('openCategoryCreator')"
                    class="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed border-brand-300 bg-brand-50/50 dark:bg-brand-950/20 text-brand-700 dark:text-brand-400 hover:bg-brand-100/70 hover:border-brand-400 transition-all text-center group min-h-[82px]"
                  >
                    <div class="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                      <PhPlus :size="18" weight="bold" />
                    </div>
                    <span class="text-xs font-bold">+ Kategori Baru</span>
                  </button>
                </div>
              </div>

              <!-- Amount Input -->
              <div>
                <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1.5">
                  Nominal (Rp)
                </label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span class="text-surface-500 font-semibold text-sm">Rp</span>
                  </div>
                  <input 
                    type="number" 
                    v-model="form.amount" 
                    required 
                    min="1" 
                    placeholder="0" 
                    class="w-full pl-12 pr-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl focus:bg-white dark:focus:bg-surface-800 focus:ring-2 focus:ring-slate-900 dark:focus:ring-brand-500 focus:border-slate-900 outline-none transition-all font-bold text-base text-surface-900 dark:text-surface-50"
                  >
                </div>
              </div>

              <!-- Description Input -->
              <div>
                <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1.5">
                  Deskripsi / Keterangan
                </label>
                <textarea 
                  v-model="form.description" 
                  rows="2" 
                  placeholder="Catatan tambahan seperti nama toko, nomor nota/struk, dsb. (opsional)" 
                  class="w-full px-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl focus:bg-white dark:focus:bg-surface-800 focus:ring-2 focus:ring-slate-900 dark:focus:ring-brand-500 focus:border-slate-900 outline-none transition-all resize-none text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400"
                ></textarea>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="flex-shrink-0 px-5 md:px-6 py-4 border-t border-surface-100 dark:border-surface-800 flex flex-col sm:flex-row justify-end gap-3 bg-surface-50/50 dark:bg-surface-900">
              <button 
                type="button" 
                @click="closeModal" 
                class="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-surface-700 dark:text-surface-300 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
              >
                Batal
              </button>
              <button 
                type="submit" 
                :disabled="loading" 
                class="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white bg-slate-900 dark:bg-brand-600 rounded-xl hover:bg-slate-800 dark:hover:bg-brand-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-sm active:scale-95"
              >
                <span v-if="loading" class="flex items-center gap-2">
                  <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Menyimpan...
                </span>
                <span v-else>
                  {{ mode === 'edit' ? 'Simpan Perubahan' : 'Simpan Pengeluaran' }}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
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
  PhPlus,
  PhX
} from '@phosphor-icons/vue'

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  expenseData?: {
    id?: string
    propertyId?: string
    date?: string
    category?: string
    amount?: string | number
    description?: string | null
  }
  propertyName?: string
  categories: any[]
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [payload: { id?: string; date: string; category: string; amount: string | number; description: string }]
  'openCategoryCreator': []
  'deleteCategory': [category: any]
}>()

interface ExpenseFormData {
  date: string
  category: string
  amount: string
  description: string
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10)
}

const form = ref<ExpenseFormData>({
  date: getTodayString(),
  category: 'Listrik & Daya (PLN)',
  amount: '',
  description: ''
})

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

function getIconComponent(iconName: string) {
  return ICON_COMPONENTS[iconName] || PhTag
}

function selectCategory(name: string) {
  form.value.category = name
}

function handleDeleteCategory(cat: any) {
  emit('deleteCategory', cat)
}

function closeModal() {
  emit('update:modelValue', false)
}


function handleSubmit() {
  emit('save', {
    id: props.expenseData?.id,
    date: form.value.date,
    category: form.value.category,
    amount: form.value.amount,
    description: form.value.description
  })
}

// Watch expenseData prop to populate form on edit mode or reset on create
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      if (props.mode === 'edit' && props.expenseData) {
        const rawDate = props.expenseData.date
        let formattedDate = getTodayString()
        if (rawDate) {
          formattedDate = typeof rawDate === 'string' 
            ? rawDate.slice(0, 10) 
            : new Date(rawDate).toISOString().slice(0, 10)
        }
        form.value = {
          date: formattedDate,
          category: props.expenseData.category || props.categories[0]?.name || 'Listrik & Daya (PLN)',
          amount: props.expenseData.amount ? String(Number(props.expenseData.amount)) : '',
          description: props.expenseData.description || ''
        }
      } else {
        form.value = {
          date: getTodayString(),
          category: props.categories[0]?.name || 'Listrik & Daya (PLN)',
          amount: '',
          description: ''
        }
      }
    }
  },
  { immediate: true }
)

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
.modal-enter-from > div,
.modal-leave-to > div {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>
