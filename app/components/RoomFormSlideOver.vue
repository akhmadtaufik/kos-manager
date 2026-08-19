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
        id="room-form-slideover-panel"
        class="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white dark:bg-surface-900 shadow-2xl border-l border-surface-200/80 dark:border-surface-800 flex flex-col overflow-hidden"
      >
        <!-- Header -->
        <div class="px-6 py-5 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between bg-surface-50/60 dark:bg-surface-850">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
              <PhDoor v-if="!isEdit" :size="20" weight="bold" />
              <PhPencilSimple v-else :size="20" weight="bold" />
            </div>
            <div>
              <h3 class="text-base font-bold text-surface-900 dark:text-surface-50 font-outfit">
                {{ isEdit ? 'Edit Data Kamar' : 'Tambah Kamar Baru' }}
              </h3>
              <p class="text-xs text-surface-500 dark:text-surface-400">
                {{ isEdit ? 'Perbarui informasi nomor kamar, harga sewa, dan biaya' : 'Atur identitas kamar, tarif sewa pokok, dan fasilitas' }}
              </p>
            </div>
          </div>
          <button 
            @click="close" 
            id="btn-close-room-form"
            type="button"
            class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-200/60 dark:hover:bg-surface-700/60 transition-all"
          >
            <PhX :size="16" weight="bold" />
          </button>
        </div>

        <!-- Body Form -->
        <form @submit.prevent="handleSubmit" class="flex-1 flex flex-col justify-between overflow-hidden">
          <div class="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
            <!-- Room Identity & Base Pricing -->
            <div class="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/40 border border-surface-200/70 dark:border-surface-700/60 space-y-4">
              <h4 class="text-xs font-bold uppercase tracking-wider text-surface-500 flex items-center gap-1.5">
                <PhDoor :size="14" weight="bold" />
                <span>Identitas & Tarif Pokok</span>
              </h4>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="block text-2xs font-bold text-surface-700 dark:text-surface-300">
                    Nomor / Nama Kamar *
                  </label>
                  <input 
                    v-model="form.roomNumber" 
                    id="input-room-number"
                    type="text" 
                    required 
                    placeholder="e.g., A101 or Mawar"
                    class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all min-h-[44px]"
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="block text-2xs font-bold text-surface-700 dark:text-surface-300">
                    Tarif Sewa Pokok (Rp / Bulan) *
                  </label>
                  <input 
                    v-model="form.monthlyRate" 
                    id="input-room-rate"
                    type="number" 
                    required 
                    min="0"
                    placeholder="e.g., 1500000"
                    class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100 rounded-xl px-3.5 py-2.5 text-xs font-medium tabular-nums focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all min-h-[44px]"
                  />
                </div>
              </div>
            </div>

            <!-- Additional Recurring Fees Section -->
            <div class="p-4 rounded-2xl bg-white dark:bg-surface-850 border border-surface-200/80 dark:border-surface-800 space-y-4 shadow-2xs">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="text-xs font-bold uppercase tracking-wider text-surface-500 flex items-center gap-1.5">
                    <PhReceipt :size="14" weight="bold" />
                    <span>Biaya Tambahan (Recurring)</span>
                  </h4>
                  <p class="text-3xs text-surface-400 mt-0.5">Biaya berkala seperti WiFi, Parkir, Kebersihan, atau Laundry.</p>
                </div>
                <button 
                  type="button" 
                  @click="addFee" 
                  id="btn-add-fee"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 hover:bg-brand-100 border border-brand-200/60 dark:border-brand-800/60 transition-all min-h-[36px]"
                >
                  <PhPlus :size="13" weight="bold" />
                  <span>Tambah Biaya</span>
                </button>
              </div>

              <div v-if="form.additionalFees.length === 0" class="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-dashed border-surface-200 dark:border-surface-700 text-center">
                <p class="text-2xs text-surface-400">Belum ada biaya tambahan. Klik tombol "Tambah Biaya" jika kamar ini memiliki tagihan rutin khusus.</p>
              </div>

              <div v-else class="space-y-3">
                <div 
                  v-for="(fee, index) in form.additionalFees" 
                  :key="index"
                  class="flex items-center gap-2.5 p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700/70"
                >
                  <div class="flex-1">
                    <label class="block text-3xs font-bold text-surface-400 mb-1">Nama Fasilitas / Biaya</label>
                    <input 
                      v-model="fee.name" 
                      type="text" 
                      placeholder="Fee Name (e.g., WiFi)"
                      required 
                      class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100 rounded-lg px-3 py-2 text-xs font-medium focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all min-h-[38px]"
                    />
                  </div>
                  <div class="flex-1">
                    <label class="block text-3xs font-bold text-surface-400 mb-1">Nominal Bulanan (Rp)</label>
                    <input 
                      v-model="fee.amount" 
                      type="number" 
                      min="0"
                      placeholder="Amount (Rp)"
                      required 
                      class="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100 rounded-lg px-3 py-2 text-xs font-medium tabular-nums focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all min-h-[38px]"
                    />
                  </div>
                  <button 
                    type="button" 
                    @click="removeFee(index)" 
                    title="Hapus Biaya"
                    class="mt-4 p-2 text-surface-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all min-h-[38px] min-w-[38px] flex items-center justify-center flex-shrink-0"
                  >
                    <PhTrash :size="16" weight="bold" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Total Pricing Live Summary Card -->
            <div class="p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200/70 dark:border-brand-800/60 flex items-center justify-between shadow-2xs">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-900/60 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
                  <PhCoins :size="16" weight="bold" />
                </div>
                <div>
                  <span class="text-3xs font-bold uppercase tracking-wider text-surface-500 block">Estimasi Total Sewa</span>
                  <p class="text-xs text-surface-600 dark:text-surface-400">Tarif pokok + seluruh biaya tambahan</p>
                </div>
              </div>
              <div class="text-right">
                <span class="text-sm md:text-base font-bold text-brand-700 dark:text-brand-300 tabular-nums">
                  Rp {{ calculatedTotal.toLocaleString('id-ID') }}
                </span>
                <span class="text-3xs text-surface-400 block">/ bulan</span>
              </div>
            </div>
          </div>

          <!-- Footer / Action Area -->
          <div class="p-5 border-t border-surface-100 dark:border-surface-800 bg-surface-50/60 dark:bg-surface-850 flex items-center justify-end gap-3">
            <button 
              @click="close" 
              id="btn-cancel-room-form"
              type="button" 
              class="px-4 py-2.5 rounded-xl text-xs font-semibold text-surface-700 dark:text-surface-300 border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 hover:bg-surface-50 transition-all shadow-2xs min-h-[44px]"
            >
              Cancel / Batal
            </button>
            <button 
              type="submit" 
              id="btn-submit-room-form"
              :disabled="isSubmitting"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-all shadow-sm active:scale-95 min-h-[44px]"
            >
              <PhSpinner v-if="isSubmitting" :size="16" class="animate-spin" />
              <span>{{ isSubmitting ? 'Menyimpan...' : (isEdit ? 'Save Changes' : 'Create / Simpan Kamar') }}</span>
            </button>
          </div>
        </form>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { 
  PhX, 
  PhDoor, 
  PhPencilSimple, 
  PhReceipt, 
  PhPlus, 
  PhTrash, 
  PhCoins, 
  PhSpinner 
} from '@phosphor-icons/vue'

const props = defineProps<{
  modelValue: boolean
  propertyId: string | null
  room: any | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'saved'): void
}>()

const { addToast } = useToast()

const isSubmitting = ref(false)
const isEdit = computed(() => !!props.room?.id)

const form = reactive({
  roomNumber: '',
  monthlyRate: '',
  additionalFees: [] as { name: string; amount: number }[]
})

const resetForm = () => {
  form.roomNumber = ''
  form.monthlyRate = ''
  form.additionalFees = []
}

const loadRoomData = (roomData: any) => {
  form.roomNumber = roomData.roomNumber || ''
  form.monthlyRate = roomData.monthlyRate ? String(roomData.monthlyRate) : ''
  form.additionalFees = Array.isArray(roomData.additionalFees) 
    ? JSON.parse(JSON.stringify(roomData.additionalFees)) 
    : []
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    if (props.room) {
      loadRoomData(props.room)
    } else {
      resetForm()
    }
  }
})

watch(() => props.room, (newRoom) => {
  if (newRoom && props.modelValue) {
    loadRoomData(newRoom)
  }
})

const addFee = () => {
  form.additionalFees.push({ name: '', amount: 0 })
}

const removeFee = (index: number) => {
  form.additionalFees.splice(index, 1)
}

const calculatedTotal = computed(() => {
  const base = Number(form.monthlyRate) || 0
  const fees = form.additionalFees.reduce((acc, f) => acc + (Number(f.amount) || 0), 0)
  return base + fees
})

const close = () => {
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  if (!form.roomNumber || !form.monthlyRate) {
    addToast('Data Tidak Lengkap', 'Nomor kamar dan tarif sewa pokok wajib diisi.', 'error')
    return
  }

  if (!props.propertyId && !isEdit.value) {
    addToast('Properti Belum Dipilih', 'Pilih properti terlebih dahulu untuk menambahkan kamar.', 'error')
    return
  }

  isSubmitting.value = true
  try {
    if (isEdit.value && props.room?.id) {
      await $fetch(`/api/rooms/${props.room.id}`, {
        method: 'PATCH',
        body: {
          roomNumber: form.roomNumber,
          monthlyRate: form.monthlyRate,
          additionalFees: form.additionalFees
        }
      })
      addToast('Berhasil', 'Data kamar berhasil diperbarui.', 'success')
    } else {
      await $fetch('/api/rooms', {
        method: 'POST',
        body: {
          propertyId: props.propertyId,
          roomNumber: form.roomNumber,
          monthlyRate: form.monthlyRate,
          additionalFees: form.additionalFees
        }
      })
      addToast('Berhasil', 'Kamar baru berhasil ditambahkan.', 'success')
    }

    emit('saved')
    close()
  } catch (err: any) {
    addToast('Gagal', err.data?.statusMessage || 'Terjadi kesalahan saat menyimpan data kamar.', 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>
