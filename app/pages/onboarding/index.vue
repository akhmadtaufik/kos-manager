<template>
  <div class="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
    <div class="max-w-3xl w-full">
      <div class="text-center mb-10">
        <h1 class="text-3xl font-bold text-slate-900 mb-4">Selamat Datang di KosManager!</h1>
        <p class="text-lg text-slate-600">Sebelum mulai, beri tahu kami apa peran utama Anda di aplikasi ini.</p>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
        <!-- Owner Card -->
        <button 
          @click="selectRole('owner')"
          :disabled="loading"
          class="relative bg-white p-8 rounded-2xl border-2 border-transparent hover:border-indigo-500 hover:shadow-xl transition-all duration-300 text-left group disabled:opacity-50"
        >
          <div class="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-slate-900 mb-2">Pemilik Kos</h2>
          <p class="text-slate-600">Saya adalah pemilik atau juragan kos. Saya ingin mengelola properti, pendapatan, dan staf saya sendiri.</p>
        </button>

        <!-- Operator Card -->
        <button 
          @click="selectRole('operator')"
          :disabled="loading"
          class="relative bg-white p-8 rounded-2xl border-2 border-transparent hover:border-emerald-500 hover:shadow-xl transition-all duration-300 text-left group disabled:opacity-50"
        >
          <div class="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-slate-900 mb-2">Penjaga Kos</h2>
          <p class="text-slate-600">Saya adalah penjaga atau pengelola harian kos. Saya bekerja untuk pemilik properti.</p>
        </button>
      </div>

      <div v-if="error" class="mt-6 p-4 bg-red-50 text-red-600 rounded-lg text-center font-medium">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false // Hide sidebar and header
})

const { getSession } = useAuth()
const loading = ref(false)
const error = ref('')

async function selectRole(role: 'owner' | 'operator') {
  try {
    loading.value = true
    error.value = ''

    await $fetch('/api/user/role', {
      method: 'POST',
      body: { role }
    })

    // Force a session refresh from the server so the new role is applied to the JWT token
    await getSession()
    
    // Redirect to dashboard
    await navigateTo('/dashboard')
  } catch (e: any) {
    error.value = e.data?.message || e.message || 'Terjadi kesalahan. Silakan coba lagi.'
  } finally {
    loading.value = false
  }
}
</script>
