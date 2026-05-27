<script setup lang="ts">
import { usePropertyState } from '~/composables/usePropertyState'
import { useAuth } from '#imports'

definePageMeta({
  layout: 'dashboard',
})

const { activePropertyId } = usePropertyState()
const { data: authData } = useAuth()
const isOwner = computed(() => ['superadmin', 'owner'].includes((authData.value?.user as any)?.role))

const staffList = ref<any[]>([])
const isLoading = ref(false)
const isSubmitting = ref(false)

const emailToInvite = ref('')
const error = ref('')
const successMsg = ref('')

const fetchStaff = async () => {
  if (!activePropertyId.value) return
  isLoading.value = true
  try {
    const res = await $fetch<any>(`/api/staff?propertyId=${activePropertyId.value}`)
    if (res.success) {
      staffList.value = res.data
    }
  } catch (err) {
    console.error('Failed to fetch staff', err)
  } finally {
    isLoading.value = false
  }
}

watch(activePropertyId, () => {
  fetchStaff()
}, { immediate: true })

const inviteOperator = async () => {
  if (!activePropertyId.value || !emailToInvite.value) return
  isSubmitting.value = true
  error.value = ''
  successMsg.value = ''
  
  try {
    const res: any = await $fetch('/api/staff', {
      method: 'POST',
      body: {
        propertyId: activePropertyId.value,
        email: emailToInvite.value
      }
    })
    successMsg.value = res.message
    emailToInvite.value = ''
    await fetchStaff()
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Gagal menambahkan operator'
  } finally {
    isSubmitting.value = false
  }
}

const removeOperator = async (userId: string) => {
  if (!confirm('Cabut akses operator ini?')) return
  try {
    const res: any = await $fetch(`/api/staff/${userId}?propertyId=${activePropertyId.value}`, {
      method: 'DELETE'
    })
    successMsg.value = res.message
    await fetchStaff()
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Gagal mencabut akses.'
  }
}
</script>

<template>
  <div v-if="!isOwner" class="text-center py-12 text-slate-500">
    Halaman ini hanya dapat diakses oleh Owner atau Superadmin.
  </div>
  <div v-else>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-slate-900 font-outfit">Staf & Operator</h1>
    </div>
    
    <div v-if="!activePropertyId" class="text-center py-16 bg-white rounded-2xl border border-slate-200 mb-8">
      <h2 class="text-xl font-bold text-slate-900 mb-2 font-outfit">Pilih Properti Aktif</h2>
      <p class="text-slate-500 mb-6 max-w-md mx-auto">Anda harus memilih spesifik properti di pojok kanan atas untuk mempekerjakan operator. Jika tidak ada pilihan selain "Global View", silakan buat properti terlebih dahulu.</p>
      <NuxtLink to="/properties" class="bg-blue-600 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors">Pergi ke Menu Properties</NuxtLink>
    </div>

    <template v-else>
      <div v-if="error" class="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
        {{ error }}
      </div>
      <div v-if="successMsg" class="mb-4 p-4 bg-emerald-50 text-emerald-600 rounded-lg">
        {{ successMsg }}
      </div>

      <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
        <h2 class="text-lg font-bold mb-4 font-outfit">Hire Operator Baru</h2>
        <p class="text-sm text-slate-500 mb-4">Pastikan calon operator telah mendaftar (Sign Up) di aplikasi KosManager menggunakan email mereka sebelum Anda menambahkannya di sini.</p>
        <form @submit.prevent="inviteOperator" class="flex gap-4">
          <input v-model="emailToInvite" type="email" required class="flex-1 bg-slate-50 border border-slate-200 text-slate-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-colors" placeholder="Email calon operator (misal: budi@gmail.com)" />
          <button type="submit" :disabled="isSubmitting" class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg px-6 py-2.5 transition-colors whitespace-nowrap">
            {{ isSubmitting ? 'Memproses...' : 'Tambah Operator' }}
          </button>
        </form>
      </div>
      
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table class="w-full text-sm text-left text-slate-500">
          <thead class="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th scope="col" class="px-6 py-3">Nama</th>
              <th scope="col" class="px-6 py-3">Email</th>
              <th scope="col" class="px-6 py-3">Ditugaskan Sejak</th>
              <th scope="col" class="px-6 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="4" class="px-6 py-8 text-center text-slate-500">Memuat data...</td>
            </tr>
            <tr v-else-if="staffList.length === 0">
              <td colspan="4" class="px-6 py-8 text-center text-slate-500">Belum ada operator untuk properti ini.</td>
            </tr>
            <tr v-for="staff in staffList" :key="staff.id" class="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4 font-bold text-slate-900">{{ staff.name || '-' }}</td>
              <td class="px-6 py-4">{{ staff.email }}</td>
              <td class="px-6 py-4">{{ new Date(staff.assignedAt).toLocaleDateString() }}</td>
              <td class="px-6 py-4">
                <button @click="removeOperator(staff.id)" class="text-rose-600 hover:text-rose-800 font-medium">Cabut Akses</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
