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
        id="tenant-form-slideover-panel"
        class="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white dark:bg-surface-900 shadow-2xl border-l border-surface-200/80 dark:border-surface-800 flex flex-col overflow-hidden"
      >
        <!-- Header -->
        <div class="px-6 py-5 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between bg-surface-50/60 dark:bg-surface-850">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
              <PhUserPlus v-if="!isEdit" :size="20" weight="bold" />
              <PhPencilSimple v-else :size="20" weight="bold" />
            </div>
            <div>
              <h3 class="text-base font-bold text-surface-900 dark:text-surface-50 font-outfit">
                {{ isEdit ? 'Edit Data Penghuni' : 'Pendaftaran Penghuni Baru' }}
              </h3>
              <p class="text-xs text-surface-500 dark:text-surface-400">
                {{ isEdit ? 'Perbarui informasi profil dan domisili penghuni' : 'Input data identitas & assign kamar sewa kos' }}
              </p>
            </div>
          </div>
          <button 
            @click="close" 
            id="btn-close-tenant-form"
            class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-200/60 dark:hover:bg-surface-700/60 transition-all"
          >
            <PhX :size="16" weight="bold" />
          </button>
        </div>

        <!-- Body Form -->
        <form @submit.prevent="handleSubmit" class="flex-1 flex flex-col justify-between overflow-hidden">
          <div class="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
            <!-- Room Assignment (Only on Create) -->
            <div v-if="!isEdit" class="space-y-1.5">
              <label class="block text-xs font-bold text-surface-700 dark:text-surface-300 flex items-center gap-1.5">
                <PhDoor :size="14" weight="bold" class="text-brand-500" />
                <span>Pilih Kamar *</span>
              </label>
              <select 
                v-model="form.roomId" 
                id="select-room"
                required 
                class="w-full bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
              >
                <option value="" disabled>-- Pilih Kamar Tersedia --</option>
                <option v-for="r in availableRooms" :key="r.id" :value="r.id">
                  Kamar {{ r.roomNumber }} (Rp {{ Number(r.monthlyRate || 0).toLocaleString('id-ID') }}/bln)
                </option>
              </select>
              <p v-if="availableRooms.length === 0" class="text-3xs text-rose-500 font-medium">
                Tidak ada kamar berstatus 'Tersedia' pada properti ini.
              </p>
            </div>

            <!-- Primary Personal Info -->
            <div class="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/40 border border-surface-200/70 dark:border-surface-700/60 space-y-4">
              <h4 class="text-xs font-bold uppercase tracking-wider text-surface-500 flex items-center gap-1.5">
                <PhUser :size="14" weight="bold" />
                <span>Informasi Pribadi</span>
              </h4>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1.5 md:col-span-2">
                  <label class="block text-2xs font-bold text-surface-700 dark:text-surface-300">
                    Nama Lengkap *
                  </label>
                  <input 
                    v-model="form.name" 
                    id="input-tenant-name"
                    type="text" 
                    required 
                    placeholder="Contoh: Budi Santoso"
                    class="w-full bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100 rounded-xl px-3.5 py-2.5 text-xs focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="block text-2xs font-bold text-surface-700 dark:text-surface-300 flex items-center gap-1">
                    <PhPhone :size="12" />
                    <span>No. HP / WhatsApp</span>
                  </label>
                  <input 
                    v-model="form.phone" 
                    id="input-tenant-phone"
                    type="tel" 
                    placeholder="Contoh: 081234567890"
                    class="w-full bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100 rounded-xl px-3.5 py-2.5 text-xs tabular-nums focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="block text-2xs font-bold text-surface-700 dark:text-surface-300 flex items-center gap-1">
                    <PhCalendar :size="12" />
                    <span>Tanggal Check-in *</span>
                  </label>
                  <input 
                    v-model="form.checkIn" 
                    id="input-tenant-checkin"
                    type="date" 
                    required 
                    class="w-full bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100 rounded-xl px-3.5 py-2.5 text-xs focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  />
                </div>

                <div class="space-y-1.5 md:col-span-2">
                  <label class="block text-2xs font-bold text-surface-700 dark:text-surface-300 flex items-center gap-1">
                    <PhPhoneCall :size="12" />
                    <span>Kontak Darurat (Nama & No. HP)</span>
                  </label>
                  <input 
                    v-model="form.emergencyContact" 
                    id="input-tenant-emergency"
                    type="text" 
                    placeholder="Contoh: Ibu Siti (081298765432)"
                    class="w-full bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100 rounded-xl px-3.5 py-2.5 text-xs focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <!-- Kemendagri Regional Standardization -->
            <div class="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/40 border border-surface-200/70 dark:border-surface-700/60 space-y-4">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-bold uppercase tracking-wider text-surface-500 flex items-center gap-1.5">
                  <PhMapPin :size="14" weight="bold" />
                  <span>Domisili Asal (Standar Kemendagri)</span>
                </h4>
                <span class="text-3xs font-semibold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200/60">
                  Data Statis
                </span>
              </div>

              <div class="space-y-3.5">
                <!-- Province -->
                <div class="space-y-1.5">
                  <label class="block text-2xs font-bold text-surface-700 dark:text-surface-300">
                    Provinsi
                  </label>
                  <select 
                    v-model="form.provinceId" 
                    id="province-select"
                    class="w-full bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100 rounded-xl px-3.5 py-2.5 text-xs focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  >
                    <option value="">-- Pilih Provinsi --</option>
                    <option v-for="prov in provinces" :key="prov.id" :value="prov.id">
                      {{ prov.name }}
                    </option>
                  </select>
                </div>

                <!-- Regency / City -->
                <div class="space-y-1.5">
                  <label class="block text-2xs font-bold text-surface-700 dark:text-surface-300">
                    Kota / Kabupaten
                  </label>
                  <select 
                    v-model="form.regencyId" 
                    id="regency-select"
                    :disabled="!form.provinceId || loadingRegencies"
                    class="w-full bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100 rounded-xl px-3.5 py-2.5 text-xs focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all disabled:opacity-50"
                  >
                    <option value="">{{ loadingRegencies ? 'Memuat Kota/Kabupaten...' : '-- Pilih Kota / Kabupaten --' }}</option>
                    <option v-for="reg in regencies" :key="reg.id" :value="reg.id">
                      {{ reg.name }}
                    </option>
                  </select>
                </div>

                <!-- District -->
                <div class="space-y-1.5">
                  <label class="block text-2xs font-bold text-surface-700 dark:text-surface-300">
                    Kecamatan
                  </label>
                  <select 
                    v-model="form.districtId" 
                    id="district-select"
                    :disabled="!form.regencyId || loadingDistricts"
                    class="w-full bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100 rounded-xl px-3.5 py-2.5 text-xs focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all disabled:opacity-50"
                  >
                    <option value="">{{ loadingDistricts ? 'Memuat Kecamatan...' : '-- Pilih Kecamatan --' }}</option>
                    <option v-for="dist in districts" :key="dist.id" :value="dist.id">
                      {{ dist.name }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="p-5 border-t border-surface-100 dark:border-surface-800 bg-surface-50/60 dark:bg-surface-850 flex items-center justify-end gap-3">
            <button 
              type="button" 
              @click="close"
              class="px-4 py-2.5 text-xs font-semibold text-surface-700 dark:text-surface-300 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-xl hover:bg-surface-50 transition-all shadow-2xs"
            >
              Batal
            </button>
            <button 
              type="submit" 
              id="btn-submit-tenant-form"
              :disabled="saving || (!isEdit && !form.roomId)"
              class="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-xl transition-all shadow-2xs active:scale-95"
            >
              <PhCheckCircle :size="15" weight="bold" />
              <span>{{ saving ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Daftarkan Penghuni') }}</span>
            </button>
          </div>
        </form>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { 
  PhUserPlus, 
  PhPencilSimple, 
  PhUser, 
  PhPhone, 
  PhPhoneCall, 
  PhDoor, 
  PhCalendar, 
  PhMapPin, 
  PhX, 
  PhCheckCircle 
} from '@phosphor-icons/vue'

const props = defineProps<{
  modelValue: boolean
  tenant: any | null
  propertyId: string | null
  availableRooms: any[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'saved'): void
}>()

const { addToast } = useToast()

const isEdit = computed(() => !!props.tenant?.id)
const saving = ref(false)

const form = reactive({
  roomId: '',
  name: '',
  phone: '',
  emergencyContact: '',
  checkIn: '',
  provinceId: '',
  regencyId: '',
  districtId: ''
})

const provinces = ref<any[]>([])
const regencies = ref<any[]>([])
const districts = ref<any[]>([])

const loadingRegencies = ref(false)
const loadingDistricts = ref(false)

const fetchProvinces = async () => {
  try {
    const res: any = await $fetch('/api/regions/provinces')
    if (res.status === 'success') {
      provinces.value = res.data || []
    }
  } catch (e) {
    console.error('Failed to load provinces', e)
  }
}

watch(() => form.provinceId, async (newVal, oldVal) => {
  if (newVal === oldVal) return
  if (!newVal) {
    form.regencyId = ''
    form.districtId = ''
    regencies.value = []
    districts.value = []
    return
  }
  
  // If user changed province, clear child selections
  if (oldVal !== undefined && oldVal !== '' && oldVal !== newVal) {
    form.regencyId = ''
    form.districtId = ''
    districts.value = []
  }

  loadingRegencies.value = true
  try {
    const res: any = await $fetch(`/api/regions/regencies?provinceId=${newVal}`)
    if (res.status === 'success') {
      regencies.value = res.data || []
    }
  } catch (e) {
    addToast('Gagal memuat wilayah', 'Tidak dapat mengambil daftar kota/kabupaten', 'error')
  } finally {
    loadingRegencies.value = false
  }
})

watch(() => form.regencyId, async (newVal, oldVal) => {
  if (newVal === oldVal) return
  if (!newVal) {
    form.districtId = ''
    districts.value = []
    return
  }

  if (oldVal !== undefined && oldVal !== '' && oldVal !== newVal) {
    form.districtId = ''
  }

  loadingDistricts.value = true
  try {
    const res: any = await $fetch(`/api/regions/districts?regencyId=${newVal}`)
    if (res.status === 'success') {
      districts.value = res.data || []
    }
  } catch (e) {
    addToast('Gagal memuat kecamatan', 'Tidak dapat mengambil daftar kecamatan', 'error')
  } finally {
    loadingDistricts.value = false
  }
})

const resetForm = () => {
  form.roomId = ''
  form.name = ''
  form.phone = ''
  form.emergencyContact = ''
  form.checkIn = new Date().toISOString().split('T')[0] || ''
  form.provinceId = ''
  form.regencyId = ''
  form.districtId = ''
  regencies.value = []
  districts.value = []
}

const initEditData = async (tenantData: any) => {
  form.roomId = tenantData.roomId || tenantData.room?.id || ''
  form.name = tenantData.name || ''
  form.phone = tenantData.phone || ''
  form.emergencyContact = tenantData.emergencyContact || ''
  form.checkIn = tenantData.checkIn ? (new Date(tenantData.checkIn).toISOString().split('T')[0] || '') : ''
  
  form.provinceId = tenantData.provinceId || ''
  if (tenantData.provinceId) {
    loadingRegencies.value = true
    try {
      const res: any = await $fetch(`/api/regions/regencies?provinceId=${tenantData.provinceId}`)
      if (res.status === 'success') regencies.value = res.data || []
    } finally {
      loadingRegencies.value = false
    }
  }

  form.regencyId = tenantData.regencyId || ''
  if (tenantData.regencyId) {
    loadingDistricts.value = true
    try {
      const res: any = await $fetch(`/api/regions/districts?regencyId=${tenantData.regencyId}`)
      if (res.status === 'success') districts.value = res.data || []
    } finally {
      loadingDistricts.value = false
    }
  }

  form.districtId = tenantData.districtId || ''
}

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    if (props.tenant) {
      initEditData(props.tenant)
    } else {
      resetForm()
    }
  }
})

onMounted(() => {
  fetchProvinces()
})

const close = () => {
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  if (!form.name || !form.checkIn) {
    addToast('Validasi Gagal', 'Nama dan tanggal check-in wajib diisi', 'error')
    return
  }

  if (!isEdit.value && !form.roomId) {
    addToast('Validasi Gagal', 'Silakan pilih kamar untuk penghuni', 'error')
    return
  }

  try {
    saving.value = true
    if (isEdit.value && props.tenant?.id) {
      await $fetch(`/api/tenants/${props.tenant.id}`, {
        method: 'PATCH',
        body: {
          action: 'update',
          name: form.name,
          phone: form.phone || undefined,
          emergencyContact: form.emergencyContact || undefined,
          checkIn: form.checkIn,
          provinceId: form.provinceId || undefined,
          regencyId: form.regencyId || undefined,
          districtId: form.districtId || undefined,
        }
      })
      addToast('Berhasil', 'Data penghuni berhasil diperbarui', 'success')
    } else {
      await $fetch('/api/tenants', {
        method: 'POST',
        body: {
          propertyId: props.propertyId,
          roomId: form.roomId,
          name: form.name,
          phone: form.phone || undefined,
          emergencyContact: form.emergencyContact || undefined,
          checkIn: form.checkIn,
          provinceId: form.provinceId || undefined,
          regencyId: form.regencyId || undefined,
          districtId: form.districtId || undefined,
        }
      })
      addToast('Berhasil', 'Penghuni baru berhasil didaftarkan', 'success')
    }

    emit('saved')
    close()
  } catch (err: any) {
    addToast('Gagal', err.data?.statusMessage || 'Gagal menyimpan data penghuni', 'error')
  } finally {
    saving.value = false
  }
}
</script>
