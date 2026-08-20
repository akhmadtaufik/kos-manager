<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { 
  PhBuildings, 
  PhPencilSimple, 
  PhX, 
  PhMapPin, 
  PhFloppyDiskBack, 
  PhSpinnerGap 
} from '@phosphor-icons/vue'

const props = defineProps<{
  modelValue: boolean
  propertyData?: {
    id?: string
    name: string
    address?: string | null
  } | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}>()

const { addToast } = useToast()

const isEdit = computed(() => !!props.propertyData?.id)
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

const form = reactive({
  name: '',
  address: ''
})

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    errorMessage.value = null
    if (props.propertyData) {
      form.name = props.propertyData.name || ''
      form.address = props.propertyData.address || ''
    } else {
      form.name = ''
      form.address = ''
    }
  }
})

const close = () => {
  emit('update:modelValue', false)
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.modelValue) {
    close()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

const handleSubmit = async () => {
  if (!form.name.trim()) {
    errorMessage.value = 'Nama properti wajib diisi.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = null

  try {
    const payload = {
      name: form.name.trim(),
      address: form.address.trim() || undefined
    }

    if (isEdit.value && props.propertyData?.id) {
      await $fetch(`/api/properties/${props.propertyData.id}`, {
        method: 'PATCH',
        body: payload
      })
      addToast('Berhasil', 'Data properti berhasil diperbarui!', 'success')
    } else {
      await $fetch('/api/properties', {
        method: 'POST',
        body: payload
      })
      addToast('Berhasil', 'Properti baru berhasil ditambahkan!', 'success')
    }

    emit('saved')
    close()
  } catch (err: any) {
    errorMessage.value = err.data?.statusMessage || err.message || 'Gagal menyimpan data properti.'
    addToast('Gagal', errorMessage.value || 'Terjadi kesalahan.', 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>

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
        id="property-form-slideover-panel"
        class="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white dark:bg-surface-900 shadow-2xl border-l border-surface-200/80 dark:border-surface-800 flex flex-col overflow-hidden"
      >
        <!-- Header -->
        <div class="px-6 py-5 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between bg-surface-50/60 dark:bg-surface-850">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
              <PhBuildings v-if="!isEdit" :size="20" weight="bold" />
              <PhPencilSimple v-else :size="20" weight="bold" />
            </div>
            <div>
              <h3 class="text-base font-bold text-surface-900 dark:text-surface-50 font-outfit">
                {{ isEdit ? 'Edit Data Properti' : 'Tambah Properti Baru' }}
              </h3>
              <p class="text-xs text-surface-500 dark:text-surface-400">
                {{ isEdit ? 'Perbarui nama dan lokasi kos' : 'Daftarkan cabang kos baru ke dalam portofolio Anda' }}
              </p>
            </div>
          </div>
          <button 
            @click="close" 
            id="btn-close-property-form"
            type="button"
            class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-200/60 dark:hover:bg-surface-700/60 transition-all"
          >
            <PhX :size="16" weight="bold" />
          </button>
        </div>

        <!-- Body Form -->
        <form @submit.prevent="handleSubmit" class="flex-1 flex flex-col justify-between overflow-hidden">
          <div class="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
            <!-- Alert Error -->
            <div 
              v-if="errorMessage" 
              class="p-3.5 rounded-xl bg-danger-50 dark:bg-danger-950/40 border border-danger-200 dark:border-danger-800/60 text-danger-700 dark:text-danger-400 text-xs font-medium"
            >
              {{ errorMessage }}
            </div>

            <!-- Property Identity Section -->
            <div class="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/40 border border-surface-200/70 dark:border-surface-700/60 space-y-4">
              <h4 class="text-xs font-bold uppercase tracking-wider text-surface-500 flex items-center gap-1.5">
                <PhBuildings :size="14" weight="bold" />
                <span>Identitas & Informasi Kos</span>
              </h4>

              <div class="space-y-4">
                <div class="space-y-1.5">
                  <label class="block text-2xs font-bold text-surface-700 dark:text-surface-300">
                    Nama Properti / Kos *
                  </label>
                  <input 
                    v-model="form.name" 
                    id="input-property-name"
                    type="text" 
                    required 
                    placeholder="e.g., Kos Eksekutif Sudirman"
                    class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all min-h-[44px]"
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="block text-2xs font-bold text-surface-700 dark:text-surface-300 flex items-center gap-1">
                    <PhMapPin :size="12" weight="bold" />
                    <span>Alamat Lengkap (Opsional)</span>
                  </label>
                  <textarea 
                    v-model="form.address" 
                    id="input-property-address"
                    rows="3"
                    placeholder="e.g., Jl. Jendral Sudirman No. 123, Jakarta Selatan"
                    class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all resize-none min-h-[88px]"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="p-6 border-t border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-850 flex items-center justify-end gap-3">
            <button 
              type="button" 
              @click="close"
              class="px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 font-bold text-xs hover:bg-surface-100 dark:hover:bg-surface-800 transition-all min-h-[44px]"
            >
              Batal
            </button>
            <button 
              type="submit" 
              id="btn-submit-property-form"
              :disabled="isSubmitting"
              class="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-brand-500/20 flex items-center gap-2 transition-all min-h-[44px]"
            >
              <PhSpinnerGap v-if="isSubmitting" :size="16" class="animate-spin" />
              <PhFloppyDiskBack v-else :size="16" weight="bold" />
              <span>{{ isSubmitting ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Simpan Properti') }}</span>
            </button>
          </div>
        </form>
      </div>
    </Transition>
  </Teleport>
</template>
