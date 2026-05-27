<template>
  <div class="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950 flex items-center justify-center p-4">
    <div class="glass-card p-8 max-w-md w-full text-center animate-fade-in">
      <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg">
        <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-gradient mb-2">KosManager</h1>
      <p class="text-surface-500 dark:text-surface-400 text-sm mb-6">
        Multi-Property Management SaaS Platform
      </p>
      <div class="flex flex-col gap-3">
        <div class="badge-success text-center py-2">
          ✅ Step 1: Scaffolding Complete
        </div>
        <div class="badge-success text-center py-2">
          ✅ Step 2: Database Schema Ready
        </div>
        <div class="badge-success text-center py-2">
          ✅ Step 3: Authentication Layer
        </div>
        <div class="badge-info text-center py-2">
          ⏳ Step 4: Core CRUD & RBAC (Next)
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  auth: false,
})
</script>
