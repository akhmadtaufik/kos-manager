<script setup lang="ts">
import { usePropertyState } from '~/composables/usePropertyState'

definePageMeta({
  layout: 'dashboard',
})

const { activePropertyId } = usePropertyState()

const rooms = ref<any[]>([])
const isLoading = ref(false)
const isCreating = ref(false)
const editingId = ref<string | null>(null)

const formData = reactive({
  roomNumber: '',
  monthlyRate: ''
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
  editingId.value = room.id
  formData.roomNumber = room.roomNumber
  formData.monthlyRate = room.monthlyRate
}

const cancelEdit = () => {
  editingId.value = null
  formData.roomNumber = ''
  formData.monthlyRate = ''
}

const submitRoom = async () => {
  if (!activePropertyId.value || !formData.roomNumber || !formData.monthlyRate) return
  isCreating.value = true
  
  try {
    if (editingId.value) {
      await $fetch(`/api/rooms/${editingId.value}`, {
        method: 'PATCH',
        body: {
          roomNumber: formData.roomNumber,
          monthlyRate: formData.monthlyRate
        }
      })
    } else {
      await $fetch('/api/rooms', {
        method: 'POST',
        body: {
          propertyId: activePropertyId.value,
          roomNumber: formData.roomNumber,
          monthlyRate: formData.monthlyRate
        }
      })
    }
    cancelEdit()
    await fetchRooms()
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Failed to save room')
  } finally {
    isCreating.value = false
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
      <h2 class="text-lg font-bold mb-4 font-outfit">{{ editingId ? 'Edit Room' : 'Add New Room' }}</h2>
        <form @submit.prevent="submitRoom" class="flex items-end gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium text-slate-700 mb-1">Room Number/Name</label>
            <input v-model="formData.roomNumber" type="text" required class="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-colors" placeholder="e.g., A101 or Mawar" />
          </div>
          <div class="flex-1">
            <label class="block text-sm font-medium text-slate-700 mb-1">Monthly Rate (Rp)</label>
            <input v-model="formData.monthlyRate" type="number" required class="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-colors" placeholder="e.g., 1500000" />
          </div>
          <button v-if="editingId" type="button" @click="cancelEdit" class="text-slate-600 hover:bg-slate-100 font-medium rounded-lg px-5 py-2.5 transition-colors">
            Cancel
          </button>
          <button type="submit" :disabled="isCreating" class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg px-5 py-2.5 transition-colors">
            {{ isCreating ? 'Saving...' : (editingId ? 'Update' : 'Create') }}
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
              <th scope="col" class="px-6 py-3">Monthly Rate</th>
              <th scope="col" class="px-6 py-3">Current Tenant</th>
              <th scope="col" class="px-6 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="5" class="px-6 py-8 text-center text-slate-500">Loading rooms...</td>
            </tr>
            <tr v-else-if="rooms.length === 0">
              <td colspan="5" class="px-6 py-8 text-center text-slate-500">No rooms found. Add one above.</td>
            </tr>
            <tr v-for="room in rooms" :key="room.id" class="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td v-if="!activePropertyId" class="px-6 py-4 text-slate-700 font-medium">{{ room.property?.name || '-' }}</td>
              <td class="px-6 py-4 font-bold text-slate-900">{{ room.roomNumber }}</td>
              <td class="px-6 py-4">
                <span v-if="room.status === 'available'" class="bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded border border-emerald-200">Available</span>
                <span v-else class="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded border border-red-200">Occupied</span>
              </td>
              <td class="px-6 py-4 font-medium text-slate-900">Rp {{ Number(room.monthlyRate).toLocaleString('id-ID') }}</td>
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
  </div>
</template>
