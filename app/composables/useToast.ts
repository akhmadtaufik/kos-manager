import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  title: string
  message: string
  type: ToastType
}

const toasts = ref<Toast[]>([])

export const useToast = () => {
  const addToast = (title: string, message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    toasts.value.push({ id, title, message, type })
    
    setTimeout(() => {
      removeToast(id)
    }, 4000)
  }

  const removeToast = (id: string) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  return {
    toasts,
    addToast,
    removeToast
  }
}
