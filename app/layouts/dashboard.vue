<script setup lang="ts">
import { usePropertyState } from '~/composables/usePropertyState'

const { loadProperties } = usePropertyState()

// Load properties globally when dashboard layout mounts
onMounted(async () => {
  await loadProperties()
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 font-inter">
    <Sidebar />
    <div class="ml-64 flex flex-col min-h-screen">
      <Header />
      <main class="flex-1 p-8">
        <slot />
      </main>
    </div>
  </div>
</template>

<style>
/* Modern scrollbar for dashboard */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
