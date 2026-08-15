<script setup lang="ts">
import { useAuth, useState } from '#imports'
import { usePropertyState } from '~/composables/usePropertyState'
import { PhHouse, PhBuildings, PhDoor, PhUsers, PhCreditCard, PhReceipt, PhUserCircle, PhChartLine, PhX } from '@phosphor-icons/vue'

const { data } = useAuth()
const { hasPermission } = usePropertyState()
const isMobileMenuOpen = useState('isMobileMenuOpen', () => false)
</script>

<template>
  <!-- Mobile Backdrop -->
  <Transition
    enter-active-class="transition-opacity ease-linear duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity ease-linear duration-300"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div 
      v-if="isMobileMenuOpen" 
      @click="isMobileMenuOpen = false"
      class="fixed inset-0 bg-surface-900/20 backdrop-blur-sm z-30 md:hidden"
    ></div>
  </Transition>

  <aside 
    :class="[
      'group/sidebar fixed left-0 top-0 h-[100dvh] bg-surface-50/90 backdrop-blur-xl border-r border-surface-200 flex flex-col z-40 transition-all duration-300 overflow-hidden',
      'w-64 md:w-20 md:hover:w-64 lg:w-64',
      isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
    ]"
  >
    <div class="h-16 flex items-center justify-between px-6 border-b border-surface-200/50 flex-shrink-0">
      <div class="font-bold text-xl text-brand-700 tracking-tight flex items-center gap-2.5">
        <div class="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center shadow-subtle">
          <PhBuildings weight="duotone" class="w-4 h-4 text-white" />
        </div>
        <span class="whitespace-nowrap transition-opacity duration-300 md:opacity-0 md:group-hover/sidebar:opacity-100 lg:opacity-100">KosManager</span>
      </div>
      <button @click="isMobileMenuOpen = false" class="md:hidden p-1 text-surface-400 hover:text-brand-600 rounded-lg">
        <PhX :size="20" weight="bold" />
      </button>
    </div>
    
    <nav class="flex-1 p-4 space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-thin relative" id="sidebar-nav">
      <NuxtLink to="/dashboard" @click="isMobileMenuOpen = false" class="group relative flex items-center gap-3 px-3 py-2.5 rounded-[0.85rem] text-surface-600 hover:text-brand-700 transition-all duration-300 z-10" active-class="text-brand-700 font-medium before:absolute before:inset-0 before:bg-white before:shadow-subtle before:rounded-[0.85rem] before:-z-10 before:transition-all before:duration-300">
        <PhHouse :size="20" weight="duotone" class="flex-shrink-0 text-surface-400 group-hover:text-brand-500 transition-colors z-10" />
        <span class="z-10 whitespace-nowrap transition-opacity duration-300 md:opacity-0 md:group-hover/sidebar:opacity-100 lg:opacity-100">Dashboard</span>
      </NuxtLink>
      <NuxtLink v-if="['superadmin', 'owner'].includes((data?.user as any)?.role)" to="/properties" @click="isMobileMenuOpen = false" class="group relative flex items-center gap-3 px-3 py-2.5 rounded-[0.85rem] text-surface-600 hover:text-brand-700 transition-all duration-300 z-10" active-class="text-brand-700 font-medium before:absolute before:inset-0 before:bg-white before:shadow-subtle before:rounded-[0.85rem] before:-z-10 before:transition-all before:duration-300">
        <PhBuildings :size="20" weight="duotone" class="flex-shrink-0 text-surface-400 group-hover:text-brand-500 transition-colors z-10" />
        <span class="z-10 whitespace-nowrap transition-opacity duration-300 md:opacity-0 md:group-hover/sidebar:opacity-100 lg:opacity-100">Properties</span>
      </NuxtLink>
      <NuxtLink v-if="hasPermission('manage_rooms')" to="/rooms" @click="isMobileMenuOpen = false" class="group relative flex items-center gap-3 px-3 py-2.5 rounded-[0.85rem] text-surface-600 hover:text-brand-700 transition-all duration-300 z-10" active-class="text-brand-700 font-medium before:absolute before:inset-0 before:bg-white before:shadow-subtle before:rounded-[0.85rem] before:-z-10 before:transition-all before:duration-300">
        <PhDoor :size="20" weight="duotone" class="flex-shrink-0 text-surface-400 group-hover:text-brand-500 transition-colors z-10" />
        <span class="z-10 whitespace-nowrap transition-opacity duration-300 md:opacity-0 md:group-hover/sidebar:opacity-100 lg:opacity-100">Rooms</span>
      </NuxtLink>
      <NuxtLink v-if="hasPermission('manage_tenants')" to="/tenants" @click="isMobileMenuOpen = false" class="group relative flex items-center gap-3 px-3 py-2.5 rounded-[0.85rem] text-surface-600 hover:text-brand-700 transition-all duration-300 z-10" active-class="text-brand-700 font-medium before:absolute before:inset-0 before:bg-white before:shadow-subtle before:rounded-[0.85rem] before:-z-10 before:transition-all before:duration-300">
        <PhUsers :size="20" weight="duotone" class="flex-shrink-0 text-surface-400 group-hover:text-brand-500 transition-colors z-10" />
        <span class="z-10 whitespace-nowrap transition-opacity duration-300 md:opacity-0 md:group-hover/sidebar:opacity-100 lg:opacity-100">Tenants</span>
      </NuxtLink>
      <NuxtLink v-if="hasPermission('manage_payments')" to="/payments" @click="isMobileMenuOpen = false" class="group relative flex items-center gap-3 px-3 py-2.5 rounded-[0.85rem] text-surface-600 hover:text-brand-700 transition-all duration-300 z-10" active-class="text-brand-700 font-medium before:absolute before:inset-0 before:bg-white before:shadow-subtle before:rounded-[0.85rem] before:-z-10 before:transition-all before:duration-300">
        <PhCreditCard :size="20" weight="duotone" class="flex-shrink-0 text-surface-400 group-hover:text-brand-500 transition-colors z-10" />
        <span class="z-10 whitespace-nowrap transition-opacity duration-300 md:opacity-0 md:group-hover/sidebar:opacity-100 lg:opacity-100">Payments</span>
      </NuxtLink>
      <NuxtLink v-if="hasPermission('manage_expenses')" to="/expenses" @click="isMobileMenuOpen = false" class="group relative flex items-center gap-3 px-3 py-2.5 rounded-[0.85rem] text-surface-600 hover:text-brand-700 transition-all duration-300 z-10" active-class="text-brand-700 font-medium before:absolute before:inset-0 before:bg-white before:shadow-subtle before:rounded-[0.85rem] before:-z-10 before:transition-all before:duration-300">
        <PhReceipt :size="20" weight="duotone" class="flex-shrink-0 text-surface-400 group-hover:text-brand-500 transition-colors z-10" />
        <span class="z-10 whitespace-nowrap transition-opacity duration-300 md:opacity-0 md:group-hover/sidebar:opacity-100 lg:opacity-100">Expenses</span>
      </NuxtLink>
      <NuxtLink v-if="['superadmin', 'owner'].includes((data?.user as any)?.role)" to="/staff" @click="isMobileMenuOpen = false" class="group relative flex items-center gap-3 px-3 py-2.5 rounded-[0.85rem] text-surface-600 hover:text-brand-700 transition-all duration-300 z-10" active-class="text-brand-700 font-medium before:absolute before:inset-0 before:bg-white before:shadow-subtle before:rounded-[0.85rem] before:-z-10 before:transition-all before:duration-300">
        <PhUserCircle :size="20" weight="duotone" class="flex-shrink-0 text-surface-400 group-hover:text-brand-500 transition-colors z-10" />
        <span class="z-10 whitespace-nowrap transition-opacity duration-300 md:opacity-0 md:group-hover/sidebar:opacity-100 lg:opacity-100">Staf & Operator</span>
      </NuxtLink>
      <NuxtLink v-if="['superadmin', 'owner'].includes((data?.user as any)?.role)" to="/dashboard/activity" @click="isMobileMenuOpen = false" class="group relative flex items-center gap-3 px-3 py-2.5 rounded-[0.85rem] text-surface-600 hover:text-brand-700 transition-all duration-300 z-10" active-class="text-brand-700 font-medium before:absolute before:inset-0 before:bg-white before:shadow-subtle before:rounded-[0.85rem] before:-z-10 before:transition-all before:duration-300">
        <PhChartLine :size="20" weight="duotone" class="flex-shrink-0 text-surface-400 group-hover:text-brand-500 transition-colors z-10" />
        <span class="z-10 whitespace-nowrap transition-opacity duration-300 md:opacity-0 md:group-hover/sidebar:opacity-100 lg:opacity-100">Activity Logs</span>
      </NuxtLink>
    </nav>
    
    <div class="p-4 border-t border-surface-200/50 bg-white/50 backdrop-blur flex-shrink-0">
      <div class="flex items-center gap-3 p-2 md:p-1 md:group-hover/sidebar:p-2 lg:p-2 rounded-xl hover:bg-white hover:shadow-subtle transition-all duration-200 cursor-pointer group active:scale-[0.98]">
        <div class="w-10 h-10 md:w-8 md:h-8 md:group-hover/sidebar:w-10 md:group-hover/sidebar:h-10 lg:w-10 lg:h-10 flex-shrink-0 rounded-full bg-surface-100 flex items-center justify-center text-surface-700 font-medium uppercase overflow-hidden border border-surface-200 group-hover:border-brand-200 group-hover:text-brand-600 transition-all duration-200">
          <img v-if="data?.user?.image" :src="data.user.image" alt="Profile" class="w-full h-full object-cover" />
          <span v-else>{{ data?.user?.name?.charAt(0) || 'U' }}</span>
        </div>
        <div class="flex-1 min-w-0 transition-opacity duration-300 md:opacity-0 md:group-hover/sidebar:opacity-100 lg:opacity-100">
          <p class="text-sm font-medium text-surface-900 truncate">{{ data?.user?.name }}</p>
          <p class="text-[11px] font-mono text-surface-500 truncate uppercase tracking-widest">{{ (data?.user as any)?.role }}</p>
        </div>
      </div>
    </div>
  </aside>
</template>
