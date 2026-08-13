<script setup lang="ts">
import { useAuth } from '#imports'
import { usePropertyState } from '~/composables/usePropertyState'
import { PhHouse, PhBuildings, PhDoor, PhUsers, PhCreditCard, PhReceipt, PhUserCircle, PhChartLine } from '@phosphor-icons/vue'

const { data } = useAuth()
const { hasPermission } = usePropertyState()
</script>

<template>
  <aside class="w-64 h-[100dvh] bg-surface-50/80 backdrop-blur-xl border-r border-surface-200 flex flex-col fixed left-0 top-0">
    <div class="h-16 flex items-center px-6 border-b border-surface-200/50">
      <div class="font-bold text-xl text-brand-700 tracking-tight flex items-center gap-2.5">
        <div class="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center shadow-subtle">
          <PhBuildings weight="duotone" class="w-4 h-4 text-white" />
        </div>
        KosManager
      </div>
    </div>
    
    <nav class="flex-1 p-4 space-y-1.5 overflow-y-auto scrollbar-thin relative" id="sidebar-nav">
      <NuxtLink to="/dashboard" class="group relative flex items-center gap-3 px-3 py-2.5 rounded-[0.85rem] text-surface-600 hover:text-brand-700 transition-all duration-300 z-10" active-class="text-brand-700 font-medium before:absolute before:inset-0 before:bg-white before:shadow-subtle before:rounded-[0.85rem] before:-z-10 before:transition-all before:duration-300">
        <PhHouse :size="20" weight="duotone" class="text-surface-400 group-hover:text-brand-500 transition-colors z-10" />
        <span class="z-10">Dashboard</span>
      </NuxtLink>
      <NuxtLink v-if="['superadmin', 'owner'].includes((data?.user as any)?.role)" to="/properties" class="group relative flex items-center gap-3 px-3 py-2.5 rounded-[0.85rem] text-surface-600 hover:text-brand-700 transition-all duration-300 z-10" active-class="text-brand-700 font-medium before:absolute before:inset-0 before:bg-white before:shadow-subtle before:rounded-[0.85rem] before:-z-10 before:transition-all before:duration-300">
        <PhBuildings :size="20" weight="duotone" class="text-surface-400 group-hover:text-brand-500 transition-colors z-10" />
        <span class="z-10">Properties</span>
      </NuxtLink>
      <NuxtLink v-if="hasPermission('manage_rooms')" to="/rooms" class="group relative flex items-center gap-3 px-3 py-2.5 rounded-[0.85rem] text-surface-600 hover:text-brand-700 transition-all duration-300 z-10" active-class="text-brand-700 font-medium before:absolute before:inset-0 before:bg-white before:shadow-subtle before:rounded-[0.85rem] before:-z-10 before:transition-all before:duration-300">
        <PhDoor :size="20" weight="duotone" class="text-surface-400 group-hover:text-brand-500 transition-colors z-10" />
        <span class="z-10">Rooms</span>
      </NuxtLink>
      <NuxtLink v-if="hasPermission('manage_tenants')" to="/tenants" class="group relative flex items-center gap-3 px-3 py-2.5 rounded-[0.85rem] text-surface-600 hover:text-brand-700 transition-all duration-300 z-10" active-class="text-brand-700 font-medium before:absolute before:inset-0 before:bg-white before:shadow-subtle before:rounded-[0.85rem] before:-z-10 before:transition-all before:duration-300">
        <PhUsers :size="20" weight="duotone" class="text-surface-400 group-hover:text-brand-500 transition-colors z-10" />
        <span class="z-10">Tenants</span>
      </NuxtLink>
      <NuxtLink v-if="hasPermission('manage_payments')" to="/payments" class="group relative flex items-center gap-3 px-3 py-2.5 rounded-[0.85rem] text-surface-600 hover:text-brand-700 transition-all duration-300 z-10" active-class="text-brand-700 font-medium before:absolute before:inset-0 before:bg-white before:shadow-subtle before:rounded-[0.85rem] before:-z-10 before:transition-all before:duration-300">
        <PhCreditCard :size="20" weight="duotone" class="text-surface-400 group-hover:text-brand-500 transition-colors z-10" />
        <span class="z-10">Payments</span>
      </NuxtLink>
      <NuxtLink v-if="hasPermission('manage_expenses')" to="/expenses" class="group relative flex items-center gap-3 px-3 py-2.5 rounded-[0.85rem] text-surface-600 hover:text-brand-700 transition-all duration-300 z-10" active-class="text-brand-700 font-medium before:absolute before:inset-0 before:bg-white before:shadow-subtle before:rounded-[0.85rem] before:-z-10 before:transition-all before:duration-300">
        <PhReceipt :size="20" weight="duotone" class="text-surface-400 group-hover:text-brand-500 transition-colors z-10" />
        <span class="z-10">Expenses</span>
      </NuxtLink>
      <NuxtLink v-if="['superadmin', 'owner'].includes((data?.user as any)?.role)" to="/staff" class="group relative flex items-center gap-3 px-3 py-2.5 rounded-[0.85rem] text-surface-600 hover:text-brand-700 transition-all duration-300 z-10" active-class="text-brand-700 font-medium before:absolute before:inset-0 before:bg-white before:shadow-subtle before:rounded-[0.85rem] before:-z-10 before:transition-all before:duration-300">
        <PhUserCircle :size="20" weight="duotone" class="text-surface-400 group-hover:text-brand-500 transition-colors z-10" />
        <span class="z-10">Staf & Operator</span>
      </NuxtLink>
      <NuxtLink v-if="['superadmin', 'owner'].includes((data?.user as any)?.role)" to="/dashboard/activity" class="group relative flex items-center gap-3 px-3 py-2.5 rounded-[0.85rem] text-surface-600 hover:text-brand-700 transition-all duration-300 z-10" active-class="text-brand-700 font-medium before:absolute before:inset-0 before:bg-white before:shadow-subtle before:rounded-[0.85rem] before:-z-10 before:transition-all before:duration-300">
        <PhChartLine :size="20" weight="duotone" class="text-surface-400 group-hover:text-brand-500 transition-colors z-10" />
        <span class="z-10">Activity Logs</span>
      </NuxtLink>
    </nav>
    
    <div class="p-4 border-t border-surface-200/50 bg-white/50 backdrop-blur">
      <div class="flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-subtle transition-all duration-200 cursor-pointer group active:scale-[0.98]">
        <div class="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-surface-700 font-medium uppercase overflow-hidden border border-surface-200 group-hover:border-brand-200 group-hover:text-brand-600 transition-colors duration-200">
          <img v-if="data?.user?.image" :src="data.user.image" alt="Profile" class="w-full h-full object-cover" />
          <span v-else>{{ data?.user?.name?.charAt(0) || 'U' }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-surface-900 truncate">{{ data?.user?.name }}</p>
          <p class="text-[11px] font-mono text-surface-500 truncate uppercase tracking-widest">{{ (data?.user as any)?.role }}</p>
        </div>
      </div>
    </div>
  </aside>
</template>
