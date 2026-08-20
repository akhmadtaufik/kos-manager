<template>
  <Teleport to="body">
    <Transition name="confirm-modal">
      <div 
        v-if="isOpen" 
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
        @click.self="handleCancel"
        @keydown.esc="handleCancel"
      >
        <div 
          class="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-surface-200/80 dark:border-surface-800 w-full max-w-md overflow-hidden transform transition-all duration-200"
          role="dialog"
          aria-modal="true"
          :aria-label="options.title"
        >
          <!-- Modal Body -->
          <div class="p-6">
            <div class="flex items-start gap-4">
              <!-- Icon Container -->
              <div 
                class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                :class="[
                  options.type === 'danger' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400' :
                  options.type === 'warning' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400' :
                  'bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400'
                ]"
              >
                <!-- Danger / Trash Icon -->
                <svg v-if="options.type === 'danger'" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <!-- Warning Icon -->
                <svg v-else-if="options.type === 'warning'" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <!-- Info / Primary Icon -->
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <h3 class="text-lg font-bold text-surface-900 dark:text-surface-50 tracking-tight">
                  {{ options.title }}
                </h3>
                <p class="mt-1.5 text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
                  {{ options.message }}
                </p>
              </div>
            </div>
          </div>

          <!-- Modal Actions Footer -->
          <div class="px-6 py-4 bg-surface-50/80 dark:bg-surface-800/40 border-t border-surface-100 dark:border-surface-800 flex items-center justify-end gap-3">
            <button 
              id="confirm-modal-cancel-btn"
              type="button" 
              @click="handleCancel" 
              class="px-4 py-2.5 text-sm font-medium text-surface-700 dark:text-surface-300 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors shadow-xs"
            >
              {{ options.cancelText }}
            </button>
            <button 
              id="confirm-modal-confirm-btn"
              type="button" 
              @click="handleConfirm" 
              class="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-2"
              :class="[
                options.type === 'danger' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' :
                options.type === 'warning' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' :
                'bg-brand-600 hover:bg-brand-700 shadow-brand-600/20'
              ]"
            >
              {{ options.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useConfirm } from '~/composables/useConfirm'

const { isOpen, options, handleConfirm, handleCancel } = useConfirm()
</script>

<style scoped>
.confirm-modal-enter-active,
.confirm-modal-leave-active {
  transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.confirm-modal-enter-from,
.confirm-modal-leave-to {
  opacity: 0;
}

.confirm-modal-enter-active > div,
.confirm-modal-leave-active > div {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.confirm-modal-enter-from > div {
  opacity: 0;
  transform: scale(0.94) translateY(8px);
}

.confirm-modal-leave-to > div {
  opacity: 0;
  transform: scale(0.96) translateY(4px);
}
</style>
