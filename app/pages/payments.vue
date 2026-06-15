<template>
  <div v-if="!activeProperty" class="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 mb-8 flex items-center gap-3">
    <div class="flex-1">
      <h2 class="font-bold text-sm">Mode Global View Aktif</h2>
      <p class="text-xs">Menampilkan seluruh tagihan dari semua properti. Pilih properti spesifik di menu atas untuk membuat tagihan bulan ini.</p>
    </div>
  </div>

  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-slate-900">Tagihan & Pembayaran</h1>
      <div v-if="activeProperty" class="flex gap-4">
        <input type="month" v-model="selectedMonth" class="px-4 py-2 border rounded-lg border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
        <button @click="generateInvoices" :disabled="generating" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
          {{ generating ? 'Generating...' : 'Buat Tagihan Bulan Ini' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
      {{ error }}
    </div>

    <div v-if="successMsg" class="mb-4 p-4 bg-emerald-50 text-emerald-600 rounded-lg">
      {{ successMsg }}
    </div>

    <phantom-ui :loading="pending">
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200">
              <th v-if="!activeProperty" class="p-4 font-medium text-slate-600">Properti</th>
              <th class="p-4 font-medium text-slate-600">Penghuni</th>
              <th class="p-4 font-medium text-slate-600">Kamar</th>
              <th class="p-4 font-medium text-slate-600">Bulan Tagihan</th>
              <th class="p-4 font-medium text-slate-600">Total</th>
              <th class="p-4 font-medium text-slate-600">Status</th>
              <th class="p-4 font-medium text-slate-600">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="pending">
              <tr v-for="i in 5" :key="'skel-'+i" class="border-b border-slate-100 hover:bg-slate-50">
                <td v-if="!activeProperty" class="p-4 text-slate-700 font-medium">Mock Property</td>
                <td class="p-4 font-medium text-slate-900">Budi Santoso</td>
                <td class="p-4 text-slate-600">A101</td>
                <td class="p-4 text-slate-600">2026-06</td>
                <td class="p-4 font-medium text-slate-900">Rp 1.500.000</td>
                <td class="p-4"><span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">Belum Lunas</span></td>
                <td class="p-4"><span class="text-sm text-blue-600 font-medium">Tandai Lunas</span></td>
              </tr>
            </template>
            <tr v-else-if="!payments?.data?.length" class="border-b border-slate-100">
              <td colspan="7" class="p-4 text-center text-slate-500">Tidak ada data tagihan.</td>
            </tr>
            <template v-else>
              <tr v-for="payment in payments.data" :key="payment.id" class="border-b border-slate-100 hover:bg-slate-50">
                <td v-if="!activeProperty" class="p-4 text-slate-700 font-medium">{{ payment.property?.name || '-' }}</td>
                <td class="p-4">
                  <p class="font-medium text-slate-900">{{ payment.tenant?.name || 'Deleted Tenant' }}</p>
                </td>
                <td class="p-4 text-slate-600">{{ payment.tenant?.room?.roomNumber || '-' }}</td>
                <td class="p-4 text-slate-600">{{ payment.billingMonth }}</td>
                <td class="p-4 font-medium text-slate-900">Rp {{ Number(payment.totalAmount).toLocaleString('id-ID') }}</td>
                <td class="p-4">
                  <span v-if="payment.status === 'paid'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    Lunas
                  </span>
                  <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                    Belum Lunas
                  </span>
                </td>
                <td class="p-4">
                  <button 
                    v-if="payment.status !== 'paid'" 
                    @click="markAsPaid(payment.id)" 
                    class="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Tandai Lunas
                  </button>
                  <span v-else class="text-sm text-slate-400">
                    Lunas pada {{ new Date(payment.paidAt).toLocaleDateString('id-ID') }}
                  </span>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </phantom-ui>
  </div>
</template>

<script setup lang="ts">
import { usePropertyState } from '~/composables/usePropertyState'

definePageMeta({
  layout: 'dashboard',
})

const { activePropertyId, activeProperty } = usePropertyState()
const selectedMonth = ref(new Date().toISOString().slice(0, 7)) // YYYY-MM
const generating = ref(false)
const error = ref('')
const successMsg = ref('')

const payments = ref<{ data: any[] }>({ data: [] })
const pending = ref(false)

const fetchPayments = async () => {
  pending.value = true
  try {
    const query = activePropertyId.value ? `?propertyId=${activePropertyId.value}` : ''
    const res = await $fetch<any>(`/api/payments${query}`)
    if (res.success) {
      payments.value.data = res.data
    }
  } catch (err) {
    console.error('Failed to fetch payments', err)
  } finally {
    pending.value = false
  }
}

watch(activePropertyId, () => {
  fetchPayments()
}, { immediate: true })

async function generateInvoices() {
  if (!activeProperty.value) return
  try {
    generating.value = true
    error.value = ''
    successMsg.value = ''

    const res: any = await $fetch('/api/payments/generate', {
      method: 'POST',
      body: {
        propertyId: activeProperty.value.id,
        billingMonth: selectedMonth.value
      }
    })

    successMsg.value = res.message
    await fetchPayments()
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'Gagal membuat tagihan.'
  } finally {
    generating.value = false
  }
}

async function markAsPaid(id: string) {
  if (!confirm('Tandai tagihan ini sebagai lunas?')) return
  try {
    error.value = ''
    await $fetch(`/api/payments/${id}`, {
      method: 'PATCH'
    })
    await fetchPayments()
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'Gagal mengubah status tagihan.'
  }
}
</script>
