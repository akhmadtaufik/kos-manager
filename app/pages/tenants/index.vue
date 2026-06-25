<script setup lang="ts">
import { usePropertyState } from '~/composables/usePropertyState'

definePageMeta({
  layout: 'dashboard',
})

const { activePropertyId } = usePropertyState()
const { addToast } = useToast()

const tenants = ref<any[]>([])
const availableRooms = ref<any[]>([])
const isLoading = ref(false)
const isCreating = ref(false)
const editingId = ref<string | null>(null)

const formData = reactive({
  roomId: '',
  name: '',
  phone: '',
  checkIn: '',
  provinceId: '',
  regencyId: '',
  districtId: ''
})

const PROVINCES = [
  { id: '31', name: 'DKI Jakarta' },
  { id: '32', name: 'Jawa Barat' }
]

const regencies = ref<any[]>([])
const districts = ref<any[]>([])
const isLoadingRegencies = ref(false)
const isLoadingDistricts = ref(false)

const onProvinceChange = async () => {
  formData.regencyId = ''
  formData.districtId = ''
  regencies.value = []
  districts.value = []
  if (!formData.provinceId) return
  
  isLoadingRegencies.value = true
  try {
    regencies.value = await $fetch<any[]>(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${formData.provinceId}.json`)
  } catch (e) {
    addToast('Gagal memuat data', 'Terjadi kesalahan saat mengambil daftar kabupaten/kota.', 'error')
  } finally {
    isLoadingRegencies.value = false
  }
}

const onRegencyChange = async () => {
  formData.districtId = ''
  districts.value = []
  if (!formData.regencyId) return
  
  isLoadingDistricts.value = true
  try {
    districts.value = await $fetch<any[]>(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${formData.regencyId}.json`)
  } catch (e) {
    addToast('Gagal memuat data', 'Terjadi kesalahan saat mengambil daftar kecamatan.', 'error')
  } finally {
    isLoadingDistricts.value = false
  }
}

const fetchTenants = async () => {
  isLoading.value = true
  try {
    const propertyQuery = activePropertyId.value ? `?propertyId=${activePropertyId.value}` : ''
    const res = await $fetch<any>(`/api/tenants${propertyQuery}`)
    if (res.status === 'success') {
      tenants.value = res.data?.data || res.data || []
    }
  } catch (err) {
    addToast('Gagal memuat data', 'Terjadi kesalahan saat mengambil daftar penghuni.', 'error')
  } finally {
    isLoading.value = false
  }
}

const fetchAvailableRooms = async () => {
  if (!activePropertyId.value) return
  try {
    const res = await $fetch<any>(`/api/rooms?propertyId=${activePropertyId.value}`)
    if (res.status === 'success') {
      const data = res.data?.data || res.data || []
      availableRooms.value = data.filter((r: any) => r.status === 'available')
    }
  } catch (err) {
    addToast('Gagal memuat data', 'Terjadi kesalahan saat mengambil daftar kamar tersedia.', 'error')
  }
}

watch(activePropertyId, () => {
  fetchTenants()
  fetchAvailableRooms()
}, { immediate: true })

const startEdit = async (tenant: any) => {
  editingId.value = tenant.id
  formData.roomId = tenant.roomId // Not editable usually, but keep for state
  formData.name = tenant.name
  formData.phone = tenant.phone || ''
  formData.checkIn = new Date(tenant.checkIn).toISOString().split('T')[0]
  formData.provinceId = tenant.provinceId || ''
  formData.regencyId = tenant.regencyId || ''
  formData.districtId = tenant.districtId || ''

  // Pre-load regencies and districts if editing an existing tenant with region data
  if (formData.provinceId) {
    isLoadingRegencies.value = true
    try {
      regencies.value = await $fetch<any[]>(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${formData.provinceId}.json`)
    } finally {
      isLoadingRegencies.value = false
    }
  }
  if (formData.regencyId) {
    isLoadingDistricts.value = true
    try {
      districts.value = await $fetch<any[]>(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${formData.regencyId}.json`)
    } finally {
      isLoadingDistricts.value = false
    }
  }
}

const cancelEdit = () => {
  editingId.value = null
  formData.roomId = ''
  formData.name = ''
  formData.phone = ''
  formData.checkIn = ''
  formData.provinceId = ''
  formData.regencyId = ''
  formData.districtId = ''
  regencies.value = []
  districts.value = []
}

const submitTenant = async () => {
  if (!activePropertyId.value || !formData.name || !formData.checkIn) return
  isCreating.value = true
  
  try {
    if (editingId.value) {
      await $fetch(`/api/tenants/${editingId.value}`, {
        method: 'PATCH',
        body: {
          action: 'update',
          name: formData.name,
          phone: formData.phone,
          checkIn: formData.checkIn,
          provinceId: formData.provinceId,
          regencyId: formData.regencyId,
          districtId: formData.districtId
        }
      })
    } else {
      if (!formData.roomId) return
      await $fetch('/api/tenants', {
        method: 'POST',
        body: {
          propertyId: activePropertyId.value,
          ...formData
        }
      })
    }
    
    cancelEdit()
    await fetchTenants()
    await fetchAvailableRooms() // Refresh available rooms list
    addToast('Berhasil', editingId.value ? 'Data penghuni diperbarui.' : 'Penghuni berhasil didaftarkan.', 'success')
  } catch (err: any) {
    addToast('Gagal', err.data?.statusMessage || 'Gagal menyimpan data penghuni.', 'error')
  } finally {
    isCreating.value = false
  }
}

const checkoutTenant = async (id: string) => {
  if (!confirm('Checkout penghuni ini? Kamar akan kembali tersedia.')) return
  try {
    await $fetch(`/api/tenants/${id}`, {
      method: 'PATCH',
      body: { action: 'checkout' }
    })
    await fetchTenants()
    await fetchAvailableRooms()
    addToast('Berhasil', 'Checkout penghuni berhasil.', 'success')
  } catch (err: any) {
    addToast('Gagal', err.data?.statusMessage || 'Gagal melakukan checkout.', 'error')
  }
}

const deleteTenant = async (id: string) => {
  if (!confirm('Hapus data historis penghuni ini secara permanen?')) return
  try {
    await $fetch(`/api/tenants/${id}`, {
      method: 'DELETE'
    })
    await fetchTenants()
    addToast('Berhasil', 'Data historis penghuni dihapus.', 'success')
  } catch (err: any) {
    addToast('Gagal', err.data?.statusMessage || 'Gagal menghapus data.', 'error')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-slate-900 font-outfit">Tenant Directory</h1>
    </div>
    
    <div v-if="!activePropertyId" class="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 mb-8 flex items-center gap-3">
      <div class="flex-1">
        <h2 class="font-bold text-sm">Mode Global View Aktif</h2>
        <p class="text-xs">Menampilkan seluruh penghuni dari semua properti. Pilih properti spesifik di menu atas untuk menambah penghuni baru.</p>
      </div>
    </div>

    <div v-if="activePropertyId" class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
      <h2 class="text-lg font-bold mb-4 font-outfit">{{ editingId ? 'Edit Tenant' : 'Onboard New Tenant' }}</h2>
        <form @submit.prevent="submitTenant" class="flex flex-col gap-5">
          <!-- Primary Info -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div v-if="!editingId">
              <label class="block text-sm font-medium text-slate-700 mb-1">Assign Room</label>
              <select v-model="formData.roomId" required class="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-colors">
                <option value="" disabled>Select Room</option>
                <option v-for="room in availableRooms" :key="room.id" :value="room.id">{{ room.roomNumber }}</option>
              </select>
            </div>
            <div :class="editingId ? 'md:col-span-2' : 'md:col-span-1'">
              <label class="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input v-model="formData.name" type="text" required class="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-colors" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input v-model="formData.phone" type="text" class="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-colors" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Check-in Date</label>
              <input v-model="formData.checkIn" type="date" required class="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-colors" />
            </div>
          </div>

          <!-- Demographics -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Province</label>
              <select id="province-select" v-model="formData.provinceId" @change="onProvinceChange" class="w-full bg-white border border-slate-200 text-slate-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-colors">
                <option value="">Select Province</option>
                <option v-for="prov in PROVINCES" :key="prov.id" :value="prov.id">{{ prov.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Regency/City</label>
              <select id="regency-select" v-model="formData.regencyId" @change="onRegencyChange" :disabled="!formData.provinceId || isLoadingRegencies" class="w-full bg-white border border-slate-200 text-slate-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-colors disabled:opacity-60">
                <option value="">{{ isLoadingRegencies ? 'Loading...' : 'Select Regency' }}</option>
                <option v-for="reg in regencies" :key="reg.id" :value="reg.id">{{ reg.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">District/Kecamatan</label>
              <select id="district-select" v-model="formData.districtId" :disabled="!formData.regencyId || isLoadingDistricts" class="w-full bg-white border border-slate-200 text-slate-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-colors disabled:opacity-60">
                <option value="">{{ isLoadingDistricts ? 'Loading...' : 'Select District' }}</option>
                <option v-for="dist in districts" :key="dist.id" :value="dist.id">{{ dist.name }}</option>
              </select>
            </div>
          </div>

          <div class="flex gap-3 justify-end mt-2">
            <button v-if="editingId" type="button" @click="cancelEdit" class="text-slate-600 hover:bg-slate-100 font-medium rounded-lg px-6 py-2.5 transition-colors">
              Cancel
            </button>
            <button type="submit" :disabled="isCreating || (!editingId && availableRooms.length === 0)" class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg px-8 py-2.5 transition-colors">
              {{ isCreating ? 'Saving...' : (editingId ? 'Update Tenant' : 'Onboard Tenant') }}
            </button>
          </div>
        </form>
      </div>
      
      <phantom-ui :loading="isLoading">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table class="w-full text-sm text-left text-slate-500">
            <thead class="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th v-if="!activePropertyId" scope="col" class="px-6 py-3">Property</th>
                <th scope="col" class="px-6 py-3">Room</th>
                <th scope="col" class="px-6 py-3">Tenant Name</th>
                <th scope="col" class="px-6 py-3">Phone</th>
                <th scope="col" class="px-6 py-3">Check In</th>
                <th scope="col" class="px-6 py-3">Status</th>
                <th scope="col" class="px-6 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <template v-if="isLoading">
                <tr v-for="i in 5" :key="'skel-'+i" class="bg-white border-b border-slate-100">
                  <td v-if="!activePropertyId" class="px-6 py-4 text-slate-700 font-medium">Mock Property</td>
                  <td class="px-6 py-4 font-bold text-slate-900">A101</td>
                  <td class="px-6 py-4 font-medium text-slate-900">Budi Santoso</td>
                  <td class="px-6 py-4">081234567890</td>
                  <td class="px-6 py-4">01/01/2026</td>
                  <td class="px-6 py-4"><span class="bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded border border-emerald-200">Active</span></td>
                  <td class="px-6 py-4"><div class="flex gap-2"><span class="text-blue-600 text-xs font-medium">Edit</span></div></td>
                </tr>
              </template>
              <tr v-else-if="tenants.length === 0">
                <td colspan="7" class="px-6 py-8 text-center text-slate-500">No tenants found for this property.</td>
              </tr>
              <template v-else>
                <tr v-for="tenant in tenants" :key="tenant.id" class="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td v-if="!activePropertyId" class="px-6 py-4 text-slate-700 font-medium">{{ tenant.room?.property?.name || '-' }}</td>
                  <td class="px-6 py-4 font-bold text-slate-900">{{ tenant.room?.roomNumber }}</td>
                  <td class="px-6 py-4 font-medium text-slate-900">{{ tenant.name }}</td>
                  <td class="px-6 py-4">{{ tenant.phone || '-' }}</td>
                  <td class="px-6 py-4">{{ new Date(tenant.checkIn).toLocaleDateString() }}</td>
                  <td class="px-6 py-4">
                    <span v-if="tenant.isActive === 1" class="bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded border border-emerald-200">Active</span>
                    <span v-else class="bg-slate-100 text-slate-800 text-xs font-medium px-2.5 py-0.5 rounded border border-slate-200">Inactive</span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex gap-2">
                      <button @click="startEdit(tenant)" class="text-blue-600 hover:text-blue-800 font-medium text-xs">Edit</button>
                      <button v-if="tenant.isActive === 1" @click="checkoutTenant(tenant.id)" class="text-amber-600 hover:text-amber-800 font-medium text-xs">Check Out</button>
                      <button @click="deleteTenant(tenant.id)" class="text-rose-600 hover:text-rose-800 font-medium text-xs">Hapus</button>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </phantom-ui>
  </div>
</template>
