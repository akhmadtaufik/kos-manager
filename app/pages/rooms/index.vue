<script setup lang="ts">
import { usePropertyState } from '~/composables/usePropertyState'
import { useConfirm } from '~/composables/useConfirm'
import { PhPencilSimple, PhTrash, PhDoor } from '@phosphor-icons/vue'

definePageMeta({
  layout: 'dashboard',
})

const { activePropertyId } = usePropertyState()
const { addToast } = useToast()
const { confirm } = useConfirm()

const rooms = ref<any[]>([])
const isLoading = ref(false)
const isCreating = ref(false)
const isEditing = ref(false)

const createFormData = reactive({
  roomNumber: '',
  monthlyRate: ''
})

const editFormData = reactive({
  id: '',
  roomNumber: '',
  monthlyRate: '',
  additionalFees: [] as { name: string; amount: number }[]
})

const fetchRooms = async () => {
  isLoading.value = true
  try {
    const propertyQuery = activePropertyId.value ? `?propertyId=${activePropertyId.value}` : ''
    const res = await $fetch<any>(`/api/rooms${propertyQuery}`)
    if (res.status === 'success') {
      rooms.value = res.data?.data || res.data || []
    }
  } catch (err) {
    addToast('Gagal memuat data', 'Terjadi kesalahan saat mengambil daftar kamar.', 'error')
  } finally {
    isLoading.value = false
  }
}

watch(activePropertyId, () => {
  fetchRooms()
}, { immediate: true })

const startEdit = (room: any) => {
  editFormData.id = room.id
  editFormData.roomNumber = room.roomNumber
  editFormData.monthlyRate = room.monthlyRate
  editFormData.additionalFees = room.additionalFees ? JSON.parse(JSON.stringify(room.additionalFees)) : []
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
  editFormData.id = ''
  editFormData.roomNumber = ''
  editFormData.monthlyRate = ''
  editFormData.additionalFees = []
}

const focusInput = () => {
  if (typeof document !== 'undefined') {
    (document.querySelector('input[type=text]') as HTMLElement)?.focus()
  }
}

const addEditFee = () => {
  editFormData.additionalFees.push({ name: '', amount: 0 })
}

const removeEditFee = (index: number) => {
  editFormData.additionalFees.splice(index, 1)
}

const submitCreateRoom = async () => {
  if (!activePropertyId.value || !createFormData.roomNumber || !createFormData.monthlyRate) return
  isCreating.value = true
  
  try {
    await $fetch('/api/rooms', {
      method: 'POST',
      body: {
        propertyId: activePropertyId.value,
        roomNumber: createFormData.roomNumber,
        monthlyRate: createFormData.monthlyRate,
        additionalFees: []
      }
    })
    createFormData.roomNumber = ''
    createFormData.monthlyRate = ''
    await fetchRooms()
    addToast('Berhasil', 'Kamar berhasil ditambahkan.', 'success')
  } catch (err: any) {
    addToast('Gagal', err.data?.statusMessage || 'Gagal membuat kamar.', 'error')
  } finally {
    isCreating.value = false
  }
}

const submitEditRoom = async () => {
  if (!editFormData.id || !editFormData.roomNumber || !editFormData.monthlyRate) return
  try {
    await $fetch(`/api/rooms/${editFormData.id}`, {
      method: 'PATCH',
      body: {
        roomNumber: editFormData.roomNumber,
        monthlyRate: editFormData.monthlyRate,
        additionalFees: editFormData.additionalFees
      }
    })
    cancelEdit()
    await fetchRooms()
    addToast('Berhasil', 'Kamar berhasil diperbarui.', 'success')
  } catch (err: any) {
    addToast('Gagal', err.data?.statusMessage || 'Gagal memperbarui kamar.', 'error')
  }
}

const deleteRoom = async (id: string) => {
  const isConfirmed = await confirm({
    title: 'Hapus Kamar',
    message: 'Apakah Anda yakin ingin menghapus kamar ini? Tindakan ini tidak dapat dibatalkan.',
    confirmText: 'Ya, Hapus',
    cancelText: 'Batal',
    type: 'danger'
  })

  if (!isConfirmed) return

  try {
    await $fetch(`/api/rooms/${id}`, {
      method: 'DELETE'
    })
    await fetchRooms()
    addToast('Berhasil', 'Kamar berhasil dihapus.', 'success')
  } catch (err: any) {
    addToast('Gagal', err.data?.statusMessage || 'Gagal menghapus kamar.', 'error')
  }
}

const calculateTotalRent = (room: any) => {
  const base = Number(room.monthlyRate) || 0
  const fees = (room.additionalFees || []).reduce((sum: number, fee: any) => sum + (Number(fee.amount) || 0), 0)
  return base + fees
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4 md:mb-6">
      <h1 class="text-xl md:text-2xl font-bold text-slate-900 font-outfit">Rooms Management</h1>
    </div>
    
    <div v-if="!activePropertyId" class="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 mb-6 md:mb-8 flex items-center gap-3">
      <div class="flex-1">
        <h2 class="font-bold text-sm">Mode Global View Aktif</h2>
        <p class="text-xs mt-0.5 md:mt-0">Menampilkan seluruh kamar dari semua properti. Pilih properti spesifik di menu atas untuk menambah kamar baru.</p>
      </div>
    </div>

    <div v-if="activePropertyId" class="bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-sm mb-6 md:mb-8">
      <h2 class="text-lg font-bold mb-4 font-outfit">Add New Room</h2>
      <form @submit.prevent="submitCreateRoom" class="flex flex-col md:flex-row items-stretch md:items-end gap-4">
        <div class="flex-1">
          <label class="block text-sm font-medium text-slate-700 mb-1">Room Number/Name</label>
          <input v-model="createFormData.roomNumber" type="text" required class="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-colors min-h-[44px]" placeholder="e.g., A101 or Mawar" />
        </div>
        <div class="flex-1">
          <label class="block text-sm font-medium text-slate-700 mb-1">Monthly Rate (Rp)</label>
          <input v-model="createFormData.monthlyRate" type="number" required class="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-colors min-h-[44px]" placeholder="e.g., 1500000" />
        </div>
        <button type="submit" :disabled="isCreating" class="w-full md:w-auto mt-2 md:mt-0 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg px-5 py-2.5 transition-colors min-h-[44px]">
          {{ isCreating ? 'Saving...' : 'Create' }}
        </button>
      </form>
    </div>
      
    <phantom-ui :loading="isLoading">
      <!-- Desktop Table View -->
      <div v-if="isLoading || rooms.length > 0" class="hidden md:block bg-white rounded-[1.5rem] border border-surface-200 shadow-sm overflow-hidden">
        <table class="w-full text-sm text-left text-surface-500">
          <thead class="text-[11px] text-surface-500 font-mono tracking-wider uppercase bg-surface-50 border-b border-surface-200">
            <tr>
              <th v-if="!activePropertyId" scope="col" class="px-8 py-5">Property</th>
              <th scope="col" class="px-8 py-5">Room Number</th>
              <th scope="col" class="px-8 py-5">Status</th>
              <th scope="col" class="px-8 py-5">Total Rent</th>
              <th scope="col" class="px-8 py-5">Current Tenant</th>
              <th scope="col" class="px-8 py-5">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="isLoading">
              <tr v-for="i in 5" :key="'skel-'+i" class="bg-white border-b border-surface-100">
                <td v-if="!activePropertyId" class="px-8 py-6 text-surface-700 font-medium">Mock Property</td>
                <td class="px-8 py-6 font-bold text-surface-900">A101</td>
                <td class="px-8 py-6">
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span class="text-emerald-700 font-medium text-sm">Available</span>
                  </div>
                </td>
                <td class="px-8 py-6 font-medium text-surface-900">Rp 1.500.000</td>
                <td class="px-8 py-6">Budi Santoso</td>
                <td class="px-8 py-6">
                  <div class="skeleton h-8 w-16 rounded-md"></div>
                </td>
              </tr>
            </template>
            <template v-else>
              <tr v-for="room in rooms" :key="room.id" class="bg-white border-b border-surface-100 hover:bg-surface-50 transition-colors">
                <td v-if="!activePropertyId" class="px-8 py-6 text-surface-700 font-medium">{{ room.property?.name || '-' }}</td>
                <td class="px-8 py-6 font-medium text-surface-900 tabular-nums tracking-tight">{{ room.roomNumber }}</td>
                <td class="px-8 py-6">
                  <div v-if="room.status === 'available'" class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span class="text-emerald-700 font-medium text-sm">Available</span>
                  </div>
                  <div v-else class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-danger-500"></div>
                    <span class="text-danger-700 font-medium text-sm">Occupied</span>
                  </div>
                </td>
                <td class="px-8 py-6 font-medium text-surface-900 tabular-nums tracking-tight">
                  <div>Rp {{ calculateTotalRent(room).toLocaleString('id-ID') }}</div>
                  <div v-if="room.additionalFees && room.additionalFees.length > 0" class="text-xs text-surface-400 font-normal mt-0.5 tracking-normal">
                    (Base: {{ Number(room.monthlyRate).toLocaleString('id-ID') }} + {{ room.additionalFees.length }} fees)
                  </div>
                </td>
                <td class="px-8 py-6">
                  <span v-if="room.tenants && room.tenants.length > 0">{{ room.tenants[0].name }}</span>
                  <span v-else class="text-surface-400">-</span>
                </td>
                <td class="px-8 py-6">
                  <div class="flex gap-2 items-center">
                    <button @click="startEdit(room)" class="p-2 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-surface-100 transition-all duration-200 group min-h-[44px] min-w-[44px] flex items-center justify-center" title="Edit">
                      <PhPencilSimple :size="18" weight="duotone" class="group-hover:scale-110 transition-transform" />
                    </button>
                    <button @click="deleteRoom(room.id)" class="p-2 rounded-lg text-surface-400 hover:text-danger-600 hover:bg-danger-50 transition-all duration-200 group min-h-[44px] min-w-[44px] flex items-center justify-center" title="Hapus">
                      <PhTrash :size="18" weight="duotone" class="group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Mobile Stacked Cards View -->
      <div v-if="isLoading || rooms.length > 0" class="md:hidden flex flex-col gap-4">
        <template v-if="isLoading">
          <div v-for="i in 5" :key="'skel-mob-'+i" class="bg-white p-5 rounded-[1.25rem] border border-surface-200 shadow-sm">
            <div class="flex justify-between items-start mb-4">
              <div class="skeleton h-5 w-24 rounded"></div>
              <div class="skeleton h-5 w-20 rounded-full"></div>
            </div>
            <div class="skeleton h-4 w-32 rounded mb-4"></div>
            <div class="border-t border-surface-100 pt-4 flex justify-between items-center">
              <div class="skeleton h-4 w-1/3 rounded"></div>
              <div class="skeleton h-10 w-20 rounded-xl"></div>
            </div>
          </div>
        </template>
        <template v-else>
          <div v-for="room in rooms" :key="'mob-'+room.id" class="bg-white p-5 rounded-[1.25rem] border border-surface-200 shadow-sm relative overflow-hidden group">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="font-bold text-surface-900 text-lg mb-1">{{ room.roomNumber }}</h3>
                <p v-if="!activePropertyId" class="text-xs text-surface-500 mb-2">
                  {{ room.property?.name || '-' }}
                </p>
                <div class="flex items-center gap-1.5 mt-1">
                  <div class="w-1.5 h-1.5 rounded-full" :class="room.status === 'available' ? 'bg-emerald-500' : 'bg-danger-500'"></div>
                  <span class="text-xs font-medium" :class="room.status === 'available' ? 'text-emerald-700' : 'text-danger-700'">
                    {{ room.status === 'available' ? 'Available' : 'Occupied' }}
                  </span>
                </div>
              </div>
              <div class="text-right">
                <div class="font-semibold text-surface-900 tabular-nums">Rp {{ calculateTotalRent(room).toLocaleString('id-ID') }}</div>
                <div v-if="room.additionalFees && room.additionalFees.length > 0" class="text-[10px] text-surface-400 mt-1">
                  + {{ room.additionalFees.length }} fees
                </div>
              </div>
            </div>
            
            <div class="mb-4 bg-surface-50 p-3 rounded-lg flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center text-surface-400 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <div class="text-[10px] text-surface-400 font-medium uppercase tracking-wider">Current Tenant</div>
                <div class="text-sm text-surface-900 font-medium">
                  <span v-if="room.tenants && room.tenants.length > 0">{{ room.tenants[0].name }}</span>
                  <span v-else class="text-surface-400 italic">None</span>
                </div>
              </div>
            </div>
            
            <div class="flex items-center justify-between mt-2 pt-4 border-t border-surface-100">
              <span class="text-xs text-surface-400">Actions</span>
              <div class="flex gap-2">
                <button @click="startEdit(room)" class="min-w-[44px] min-h-[44px] flex items-center justify-center bg-surface-50 text-surface-600 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors">
                  <PhPencilSimple :size="20" weight="duotone" />
                </button>
                <button @click="deleteRoom(room.id)" class="min-w-[44px] min-h-[44px] flex items-center justify-center bg-surface-50 text-surface-600 hover:text-danger-600 hover:bg-danger-50 rounded-xl transition-colors">
                  <PhTrash :size="20" weight="duotone" />
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
      
      <!-- Premium Empty State -->
      <div v-else class="bg-white rounded-[1.5rem] border border-surface-200 shadow-sm overflow-hidden p-16 relative flex flex-col items-center justify-center text-center">
        <!-- Grid Background Pattern -->
        <div class="absolute inset-0 pointer-events-none opacity-[0.03]" style="background-image: radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0); background-size: 24px 24px;"></div>
        
        <div class="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-5 relative z-10 ring-8 ring-brand-50/50">
          <PhDoor :size="32" weight="duotone" class="text-brand-600" />
        </div>
        <h3 class="text-xl font-bold text-surface-900 mb-2 relative z-10 font-outfit">No Rooms Yet</h3>
        <p class="text-[15px] text-surface-500 max-w-sm mb-8 relative z-10 leading-relaxed">You haven't added any rooms to this property. Get started by creating your first room to manage occupancy.</p>
        <button @click="focusInput" class="bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl px-6 py-3 transition-all duration-300 active:scale-[0.98] shadow-subtle relative z-10">
          Add New Room
        </button>
      </div>
    </phantom-ui>

    <!-- Edit Modal / Bottom Sheet -->
    <div v-if="isEditing" class="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-surface-950/40 backdrop-blur-md p-0 md:p-4 transition-all">
      <div class="bg-white rounded-t-[1.5rem] md:rounded-[1.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-surface-950/5 mt-auto md:mt-0">
        <!-- Mobile Handle -->
        <div class="w-full flex justify-center pt-3 pb-1 md:hidden bg-white">
          <div class="w-12 h-1.5 bg-surface-200 rounded-full"></div>
        </div>

        <div class="p-4 md:p-6 border-b border-surface-100 flex items-center justify-between bg-white">
          <h2 class="text-xl font-bold text-surface-900 font-outfit">Edit Room</h2>
          <button @click="cancelEdit" class="text-surface-400 hover:text-surface-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-surface-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto flex-1">
          <form id="edit-room-form" @submit.prevent="submitEditRoom" class="space-y-6">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-surface-700 mb-1">Room Number/Name</label>
                <input v-model="editFormData.roomNumber" type="text" required class="w-full bg-surface-50 border border-surface-200 text-surface-900 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 block p-2.5 outline-none transition-shadow" />
              </div>
              <div>
                <label class="block text-sm font-medium text-surface-700 mb-1">Base Monthly Rate (Rp)</label>
                <input v-model="editFormData.monthlyRate" type="number" required class="w-full bg-surface-50 border border-surface-200 text-surface-900 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 block p-2.5 outline-none transition-shadow tabular-nums" />
              </div>
            </div>

            <div class="border-t border-surface-200 pt-6 mt-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-semibold text-surface-900">Additional Fees (Recurring)</h3>
                <button type="button" @click="addEditFee" class="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1.5 transition-colors min-h-[44px] px-2 -mr-2 rounded-lg hover:bg-brand-50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                  Add Fee
                </button>
              </div>

              <div class="bg-surface-50 border border-surface-200 rounded-xl p-5">
                <div v-if="editFormData.additionalFees.length === 0" class="text-center py-4 text-surface-500 text-sm">
                  No additional fees. Click "Add Fee" to include WiFi, Laundry, Parking, etc.
                </div>

                <div v-else class="space-y-4">
                  <div v-for="(fee, index) in editFormData.additionalFees" :key="index" class="flex items-center gap-3">
                    <div class="flex-1">
                      <input v-model="fee.name" type="text" placeholder="Fee Name (e.g., WiFi)" required class="w-full bg-white border border-surface-200 text-surface-900 text-sm rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 block p-2.5 outline-none transition-shadow" />
                    </div>
                    <div class="flex-1">
                      <input v-model="fee.amount" type="number" placeholder="Amount (Rp)" required class="w-full bg-white border border-surface-200 text-surface-900 text-sm rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 block p-2.5 outline-none transition-shadow tabular-nums" />
                    </div>
                    <button type="button" @click="removeEditFee(index)" class="p-2.5 text-surface-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors group min-w-[44px] min-h-[44px] flex items-center justify-center">
                      <PhTrash :size="18" weight="duotone" class="group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        <div class="p-4 md:p-6 border-t border-surface-100 bg-surface-50 flex flex-col sm:flex-row items-center justify-end gap-3 md:rounded-b-[1.5rem]">
          <button @click="cancelEdit" class="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-surface-600 hover:bg-surface-200/50 rounded-lg transition-colors min-h-[44px]">
            Cancel
          </button>
          <button type="submit" form="edit-room-form" class="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors shadow-subtle active:scale-[0.98] min-h-[44px]">
            Save Changes
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
