<script setup lang="ts">
import { useAuth } from '#imports'
import { usePropertyState } from '~/composables/usePropertyState'

const { signOut } = useAuth()
const { properties, activePropertyId, setActiveProperty } = usePropertyState()

const handleSignOut = async () => {
  await signOut({ callbackUrl: '/' })
}
</script>

<template>
  <header class="h-16 bg-white/70 backdrop-blur-xl border-b border-surface-200/50 flex items-center justify-between px-6 sticky top-0 z-20">
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2.5">
        <label for="property-switcher" class="text-[13px] font-medium text-surface-500 tracking-wide uppercase">Property</label>
        <div class="relative">
          <select 
            id="property-switcher"
            v-model="activePropertyId"
            @change="setActiveProperty(activePropertyId)"
            class="appearance-none bg-surface-50/50 hover:bg-surface-100 border border-surface-200 text-surface-900 text-sm font-medium rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 block pl-3 pr-8 py-1.5 outline-none cursor-pointer transition-colors duration-200 shadow-sm"
          >
            <option :value="null">Global View</option>
            <option v-for="property in properties" :key="property.id" :value="property.id">
              {{ property.name }}
            </option>
          </select>
          <div class="absolute inset-y-0 right-0 flex items-center px-2.5 pointer-events-none text-surface-400">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>
    </div>
    
    <div class="flex items-center gap-4">
      <button 
        @click="handleSignOut" 
        class="text-sm font-medium text-red-600 hover:text-red-700 transition-colors bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg"
      >
        Logout
      </button>
    </div>
  </header>
</template>
