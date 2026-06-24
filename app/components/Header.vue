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
  <header class="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <label for="property-switcher" class="text-sm font-medium text-slate-500">Property:</label>
        <select 
          id="property-switcher"
          v-model="activePropertyId"
          @change="setActiveProperty(activePropertyId)"
          class="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none cursor-pointer"
        >
          <option :value="null">Global View (Semua Properti)</option>
          <option v-for="property in properties" :key="property.id" :value="property.id">
            {{ property.name }}
          </option>
        </select>
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
