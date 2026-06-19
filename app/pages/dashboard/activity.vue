<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Activity Logs</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400">Monitor all actions across your properties.</p>
      </div>
      <div class="flex items-center space-x-3">
        <!-- Filter Bar -->
        <select
          v-model="roleFilter"
          class="block w-40 rounded-md border-0 py-1.5 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-slate-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
        >
          <option value="all">All Actors</option>
          <option value="owner">Owners</option>
          <option value="operator">Operators</option>
        </select>
        <button
          @click="fetchLogs"
          class="inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          Refresh
        </button>
      </div>
    </div>

    <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
        <thead class="bg-slate-50 dark:bg-slate-800/50">
          <tr>
            <th scope="col" class="px-4 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-white">Timestamp</th>
            <th scope="col" class="px-4 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-white">Actor</th>
            <th scope="col" class="px-4 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-white">Action & Details</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
          <!-- Phantom UI Skeleton Loader -->
          <phantom-ui :loading="isLoading" v-if="isLoading">
            <tr v-for="i in 5" :key="'skeleton-'+i">
              <td class="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                <div class="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700"></div>
              </td>
              <td class="whitespace-nowrap px-4 py-3">
                <div class="flex items-center">
                  <div class="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                  <div class="ml-3 h-4 w-24 rounded bg-slate-200 dark:bg-slate-700"></div>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-slate-500">
                <div class="h-4 w-64 rounded bg-slate-200 dark:bg-slate-700"></div>
              </td>
            </tr>
          </phantom-ui>
          
          <template v-else>
            <tr v-if="logs.length === 0">
              <td colspan="3" class="px-8 py-16 text-center">
                <div class="mx-auto flex max-w-sm flex-col items-center justify-center text-center">
                  <div class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    <svg class="h-6 w-6 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 class="mt-4 text-base font-semibold text-slate-900 dark:text-white">No activity yet</h3>
                  <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    There are no recent actions recorded for your account or associated operators.
                  </p>
                </div>
              </td>
            </tr>
            <tr v-for="log in logs" :key="log.id" class="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td class="whitespace-nowrap px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                {{ formatDate(log.createdAt) }}
              </td>
              <td class="whitespace-nowrap px-4 py-3">
                <div class="flex items-center">
                  <div class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {{ (log.actorName || '?').charAt(0).toUpperCase() }}
                  </div>
                  <div class="ml-3">
                    <p class="text-sm font-medium text-slate-900 dark:text-white">{{ log.actorName || 'System' }}</p>
                    <span
                      class="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset"
                      :class="{
                        'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400': log.actorRole === 'owner',
                        'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400': log.actorRole === 'operator',
                        'bg-slate-50 text-slate-600 ring-slate-500/10 dark:bg-slate-800 dark:text-slate-400': !log.actorRole || (log.actorRole !== 'owner' && log.actorRole !== 'operator')
                      }"
                    >
                      {{ capitalize(log.actorRole || 'System') }}
                    </span>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                <p class="font-medium text-slate-900 dark:text-white">{{ formatAction(log.action) }}</p>
                <p class="mt-0.5 text-xs text-slate-500">{{ formatDetails(log) }}</p>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
      
      <!-- Pagination controls -->
      <div v-if="!isLoading && totalPages > 1" class="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
        <div class="flex flex-1 justify-between sm:hidden">
          <button @click="prevPage" :disabled="page === 1" class="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">Previous</button>
          <button @click="nextPage" :disabled="page === totalPages" class="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">Next</button>
        </div>
        <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-slate-700 dark:text-slate-300">
              Showing page <span class="font-medium">{{ page }}</span> of <span class="font-medium">{{ totalPages }}</span>
            </p>
          </div>
          <div>
            <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                @click="prevPage"
                :disabled="page === 1"
                class="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 dark:ring-slate-700 dark:hover:bg-slate-800"
              >
                <span class="sr-only">Previous</span>
                &larr;
              </button>
              <button
                @click="nextPage"
                :disabled="page === totalPages"
                class="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 dark:ring-slate-700 dark:hover:bg-slate-800"
              >
                <span class="sr-only">Next</span>
                &rarr;
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

definePageMeta({
  layout: 'dashboard'
})

// State
const logs = ref<any[]>([])
const isLoading = ref(true)
const roleFilter = ref('all')
const page = ref(1)
const totalPages = ref(1)

// Fetch Data
const fetchLogs = async () => {
  isLoading.value = true
  try {
    const response = await $fetch('/api/audit', {
      params: {
        role: roleFilter.value,
        page: page.value,
        limit: 15
      }
    })
    console.error('AUDIT FETCH RESPONSE:', JSON.stringify(response))
    logs.value = response.data || []
    totalPages.value = response.meta.totalPages || 1
  } catch (error) {
    console.error('Failed to fetch activity logs', error)
  } finally {
    isLoading.value = false
  }
}

// Watchers
watch(roleFilter, () => {
  page.value = 1
  fetchLogs()
})

onMounted(() => {
  fetchLogs()
})

// Pagination Actions
const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
    fetchLogs()
  }
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    fetchLogs()
  }
}

// Formatters
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const capitalize = (str: string) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

const formatAction = (action: string) => {
  return action.split('_').map(capitalize).join(' ')
}

const formatDetails = (log: any) => {
  if (!log.details) return 'No additional details'
  
  if (log.action === 'CREATE_PROPERTY' && log.details.name) {
    return `Property: ${log.details.name}`
  }
  if (log.action === 'CHECKIN_TENANT' && log.details.name) {
    return `Tenant: ${log.details.name}`
  }
  if (log.action === 'ADD_ROOM' && log.details.roomNumber) {
    return `Room Number: ${log.details.roomNumber}`
  }
  
  // Fallback for generic JSON display
  try {
    const keys = Object.keys(log.details)
    if (keys.length > 0) {
      return keys.map(k => `${k}: ${log.details[k]}`).join(', ')
    }
  } catch (e) {
    // ignore
  }
  
  return 'Updated system records'
}
</script>
