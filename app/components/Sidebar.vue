<script setup lang="ts">
import { useAuth } from '#imports'

const { data } = useAuth()
</script>

<template>
  <aside class="w-64 h-screen bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0">
    <div class="h-16 flex items-center px-6 border-b border-slate-200">
      <div class="font-bold text-xl text-blue-600 font-outfit">KosManager</div>
    </div>
    
    <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
      <NuxtLink to="/dashboard" class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors" active-class="bg-blue-50 text-blue-700 font-medium">
        <span>Dashboard</span>
      </NuxtLink>
      <NuxtLink to="/properties" class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors" active-class="bg-blue-50 text-blue-700 font-medium">
        <span>Properties</span>
      </NuxtLink>
      <NuxtLink to="/rooms" class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors" active-class="bg-blue-50 text-blue-700 font-medium">
        <span>Rooms</span>
      </NuxtLink>
      <NuxtLink to="/tenants" class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors" active-class="bg-blue-50 text-blue-700 font-medium">
        <span>Tenants</span>
      </NuxtLink>
      <NuxtLink to="/payments" class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors" active-class="bg-blue-50 text-blue-700 font-medium">
        <span>Payments</span>
      </NuxtLink>
      <NuxtLink to="/expenses" class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors" active-class="bg-blue-50 text-blue-700 font-medium">
        <span>Expenses</span>
      </NuxtLink>
      <NuxtLink v-if="['superadmin', 'owner'].includes((data?.user as any)?.role)" to="/staff" class="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors" active-class="bg-blue-50 text-blue-700 font-medium">
        <span>Staf & Operator</span>
      </NuxtLink>
    </nav>
    
    <div class="p-4 border-t border-slate-200">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold uppercase overflow-hidden">
          <img v-if="data?.user?.image" :src="data.user.image" alt="Profile" class="w-full h-full object-cover" />
          <span v-else>{{ data?.user?.name?.charAt(0) || 'U' }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-slate-900 truncate">{{ data?.user?.name }}</p>
          <p class="text-xs text-slate-500 truncate capitalize">{{ (data?.user as any)?.role }}</p>
        </div>
      </div>
    </div>
  </aside>
</template>
