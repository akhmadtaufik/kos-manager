<script setup lang="ts">
import { clearError } from '#app'
import type { NuxtError } from '#app'

const props = defineProps({
  error: Object as () => NuxtError
})

const statusCode = props.error?.statusCode || 500
const message = statusCode === 404 ? 'Halaman tidak ditemukan' : 'Terjadi gangguan pada sistem kami'

// Extract reqId from the NuxtError data property (often populated from API responses)
const reqId = props.error?.data?.reqId || props.error?.reqId || null

const handleError = () => clearError({ redirect: '/dashboard' })
</script>

<template>
  <div class="min-h-[100dvh] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6">
    <div class="max-w-md w-full text-center space-y-6">
      <h1 class="text-8xl font-medium tracking-tighter text-slate-300 dark:text-slate-700 select-none">
        {{ statusCode }}
      </h1>
      
      <div class="space-y-2">
        <h2 class="text-2xl font-medium tracking-tight">
          {{ message }}
        </h2>
        <p class="text-slate-500 dark:text-slate-400 leading-relaxed">
          Mohon maaf atas ketidaknyamanan ini. Silakan kembali ke dashboard untuk melanjutkan aktivitas Anda.
        </p>
      </div>

      <div class="pt-4">
        <button 
          @click="handleError"
          class="inline-flex items-center justify-center px-6 py-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
        >
          Kembali ke Dashboard
        </button>
      </div>
    </div>

    <div v-if="reqId" class="absolute bottom-8 left-0 w-full text-center">
      <span class="text-xs font-mono text-slate-400 dark:text-slate-500 tracking-wider uppercase">
        Error Reference: {{ reqId }}
      </span>
    </div>
  </div>
</template>
