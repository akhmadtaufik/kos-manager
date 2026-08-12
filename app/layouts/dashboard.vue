<script setup lang="ts">
import { usePropertyState } from '~/composables/usePropertyState'

const { loadProperties } = usePropertyState()

// Load properties globally when dashboard layout mounts
onMounted(async () => {
  await loadProperties()
})
</script>

<template>
  <div class="min-h-[100dvh] bg-surface-50 text-surface-900 font-sans selection:bg-brand-500/30">
    <Sidebar />
    <div class="ml-64 flex flex-col min-h-[100dvh]">
      <Header />
      <main class="flex-1 p-8 max-w-[1600px] w-full mx-auto">
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
