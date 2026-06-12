<script setup lang="ts">
import { usePropertyState } from '~/composables/usePropertyState'

definePageMeta({
  layout: 'dashboard',
})

const { activePropertyId } = usePropertyState()

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
    if (res.success) {
      rooms.value = res.data
    }
  } catch (err) {
    console.error('Failed to fetch rooms', err)
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
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Failed to create room')
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
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Failed to update room')
  }
}

const deleteRoom = async (id: string) => {
  if (!confirm('Hapus kamar ini?')) return
  try {
    await $fetch(`/api/rooms/${id}`, {
      method: 'DELETE'
    })
    await fetchRooms()
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Gagal menghapus kamar.')
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
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-slate-900 font-outfit">Rooms Management</h1>
    </div>
    
    <div v-if="!activePropertyId" class="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 mb-8 flex items-center gap-3">
      <div class="flex-1">
        <h2 class="font-bold text-sm">Mode Global View Aktif</h2>
        <p class="text-xs">Menampilkan seluruh kamar dari semua properti. Pilih properti spesifik di menu atas untuk menambah kamar baru.</p>
      </div>
    </div>

    <div v-if="activePropertyId" class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
      <h2 class="text-lg font-bold mb-4 font-outfit">Add New Room</h2>
      <form @submit.prevent="submitCreateRoom" class="flex items-end gap-4">
        <div class="flex-1">
          <label class="block text-sm font-medium text-slate-700 mb-1">Room Number/Name</label>
          <input v-model="createFormData.roomNumber" type="text" required class="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-colors" placeholder="e.g., A101 or Mawar" />
        </div>
        <div class="flex-1">
          <label class="block text-sm font-medium text-slate-700 mb-1">Monthly Rate (Rp)</label>
          <input v-model="createFormData.monthlyRate" type="number" required class="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-colors" placeholder="e.g., 1500000" />
        </div>
        <button type="submit" :disabled="isCreating" class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg px-5 py-2.5 transition-colors">
          {{ isCreating ? 'Saving...' : 'Create' }}
        </button>
      </form>
    </div>
      
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <table class="w-full text-sm text-left text-slate-500">
        <thead class="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
          <tr>
            <th v-if="!activePropertyId" scope="col" class="px-6 py-3">Property</th>
            <th scope="col" class="px-6 py-3">Room Number</th>
            <th scope="col" class="px-6 py-3">Status</th>
            <th scope="col" class="px-6 py-3">Total Rent</th>
            <th scope="col" class="px-6 py-3">Current Tenant</th>
            <th scope="col" class="px-6 py-3">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="6" class="px-6 py-8 text-center text-slate-500">Loading rooms...</td>
          </tr>
          <tr v-else-if="rooms.length === 0">
            <td colspan="6" class="px-6 py-8 text-center text-slate-500">No rooms found. Add one above.</td>
          </tr>
          <tr v-for="room in rooms" :key="room.id" class="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <td v-if="!activePropertyId" class="px-6 py-4 text-slate-700 font-medium">{{ room.property?.name || '-' }}</td>
            <td class="px-6 py-4 font-bold text-slate-900">{{ room.roomNumber }}</td>
            <td class="px-6 py-4">
              <span v-if="room.status === 'available'" class="bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded border border-emerald-200">Available</span>
              <span v-else class="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded border border-red-200">Occupied</span>
            </td>
            <td class="px-6 py-4 font-medium text-slate-900">
              <div>Rp {{ calculateTotalRent(room).toLocaleString('id-ID') }}</div>
              <div v-if="room.additionalFees && room.additionalFees.length > 0" class="text-xs text-slate-400 font-normal mt-0.5">
                (Base: {{ Number(room.monthlyRate).toLocaleString('id-ID') }} + {{ room.additionalFees.length }} fees)
              </div>
            </td>
            <td class="px-6 py-4">
              <span v-if="room.tenants && room.tenants.length > 0">{{ room.tenants[0].name }}</span>
              <span v-else class="text-slate-400">-</span>
            </td>
            <td class="px-6 py-4">
              <div class="flex gap-3">
                <button @click="startEdit(room)" class="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                <button @click="deleteRoom(room.id)" class="text-rose-600 hover:text-rose-800 font-medium">Hapus</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Edit Modal -->
    <div v-if="isEditing" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 class="text-xl font-bold text-slate-900 font-outfit">Edit Room</h2>
          <button @click="cancelEdit" class="text-slate-400 hover:text-slate-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto flex-1">
          <form id="edit-room-form" @submit.prevent="submitEditRoom" class="space-y-6">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Room Number/Name</label>
                <input v-model="editFormData.roomNumber" type="text" required class="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-colors" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Base Monthly Rate (Rp)</label>
                <input v-model="editFormData.monthlyRate" type="number" required class="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-colors" />
              </div>
            </div>

            <div class="border-t border-slate-100 pt-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-bold text-slate-900">Additional Fees (Recurring)</h3>
                <button type="button" @click="addEditFee" class="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                  Add Fee
                </button>
              </div>

              <div v-if="editFormData.additionalFees.length === 0" class="text-center py-4 bg-slate-50 rounded-lg border border-slate-100 text-slate-500 text-sm">
                No additional fees. Click "Add Fee" to include WiFi, Laundry, Parking, etc.
              </div>

              <div v-else class="space-y-3">
                <div v-for="(fee, index) in editFormData.additionalFees" :key="index" class="flex items-center gap-3">
                  <div class="flex-1">
                    <input v-model="fee.name" type="text" placeholder="Fee Name (e.g., WiFi)" required class="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-colors" />
                  </div>
                  <div class="flex-1">
                    <input v-model="fee.amount" type="number" placeholder="Amount (Rp)" required class="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-colors" />
                  </div>
                  <button type="button" @click="removeEditFee(index)" class="p-2.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        <div class="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button @click="cancelEdit" class="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors">
            Cancel
          </button>
          <button type="submit" form="edit-room-form" class="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">
            Save Changes
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
