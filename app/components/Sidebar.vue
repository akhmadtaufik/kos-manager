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
    
    <nav class="flex-1 p-4 space-y-1.5 overflow-y-auto scrollbar-thin">
      <NuxtLink to="/dashboard" class="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-surface-600 hover:bg-white hover:text-brand-700 hover:shadow-subtle transition-all duration-200 active:scale-[0.98]" active-class="bg-white shadow-subtle text-brand-700 font-medium">
        <PhHouse :size="20" weight="duotone" class="text-surface-400 group-hover:text-brand-500 transition-colors" />
        <span>Dashboard</span>
      </NuxtLink>
      <NuxtLink v-if="['superadmin', 'owner'].includes((data?.user as any)?.role)" to="/properties" class="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-surface-600 hover:bg-white hover:text-brand-700 hover:shadow-subtle transition-all duration-200 active:scale-[0.98]" active-class="bg-white shadow-subtle text-brand-700 font-medium">
        <PhBuildings :size="20" weight="duotone" class="text-surface-400 group-hover:text-brand-500 transition-colors" />
        <span>Properties</span>
      </NuxtLink>
      <NuxtLink v-if="hasPermission('manage_rooms')" to="/rooms" class="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-surface-600 hover:bg-white hover:text-brand-700 hover:shadow-subtle transition-all duration-200 active:scale-[0.98]" active-class="bg-white shadow-subtle text-brand-700 font-medium">
        <PhDoor :size="20" weight="duotone" class="text-surface-400 group-hover:text-brand-500 transition-colors" />
        <span>Rooms</span>
      </NuxtLink>
      <NuxtLink v-if="hasPermission('manage_tenants')" to="/tenants" class="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-surface-600 hover:bg-white hover:text-brand-700 hover:shadow-subtle transition-all duration-200 active:scale-[0.98]" active-class="bg-white shadow-subtle text-brand-700 font-medium">
        <PhUsers :size="20" weight="duotone" class="text-surface-400 group-hover:text-brand-500 transition-colors" />
        <span>Tenants</span>
      </NuxtLink>
      <NuxtLink v-if="hasPermission('manage_payments')" to="/payments" class="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-surface-600 hover:bg-white hover:text-brand-700 hover:shadow-subtle transition-all duration-200 active:scale-[0.98]" active-class="bg-white shadow-subtle text-brand-700 font-medium">
        <PhCreditCard :size="20" weight="duotone" class="text-surface-400 group-hover:text-brand-500 transition-colors" />
        <span>Payments</span>
      </NuxtLink>
      <NuxtLink v-if="hasPermission('manage_expenses')" to="/expenses" class="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-surface-600 hover:bg-white hover:text-brand-700 hover:shadow-subtle transition-all duration-200 active:scale-[0.98]" active-class="bg-white shadow-subtle text-brand-700 font-medium">
        <PhReceipt :size="20" weight="duotone" class="text-surface-400 group-hover:text-brand-500 transition-colors" />
        <span>Expenses</span>
      </NuxtLink>
      <NuxtLink v-if="['superadmin', 'owner'].includes((data?.user as any)?.role)" to="/staff" class="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-surface-600 hover:bg-white hover:text-brand-700 hover:shadow-subtle transition-all duration-200 active:scale-[0.98]" active-class="bg-white shadow-subtle text-brand-700 font-medium">
        <PhUserCircle :size="20" weight="duotone" class="text-surface-400 group-hover:text-brand-500 transition-colors" />
        <span>Staf & Operator</span>
      </NuxtLink>
      <NuxtLink v-if="['superadmin', 'owner'].includes((data?.user as any)?.role)" to="/dashboard/activity" class="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-surface-600 hover:bg-white hover:text-brand-700 hover:shadow-subtle transition-all duration-200 active:scale-[0.98]" active-class="bg-white shadow-subtle text-brand-700 font-medium">
        <PhChartLine :size="20" weight="duotone" class="text-surface-400 group-hover:text-brand-500 transition-colors" />
        <span>Activity Logs</span>
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
