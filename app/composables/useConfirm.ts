import { ref } from 'vue'

export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info' | 'primary'
}

const isOpen = ref(false)
const options = ref<ConfirmOptions>({
  title: 'Konfirmasi Tindakan',
  message: '',
  confirmText: 'Ya, Lanjutkan',
  cancelText: 'Batal',
  type: 'danger'
})

let resolver: ((val: boolean) => void) | null = null

export const useConfirm = () => {
  const confirm = (opts: ConfirmOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof opts === 'string') {
        options.value = {
          title: 'Konfirmasi Tindakan',
          message: opts,
          confirmText: 'Ya, Lanjutkan',
          cancelText: 'Batal',
          type: 'danger'
        }
      } else {
        options.value = {
          title: opts.title || 'Konfirmasi Tindakan',
          message: opts.message,
          confirmText: opts.confirmText || 'Ya, Lanjutkan',
          cancelText: opts.cancelText || 'Batal',
          type: opts.type || 'danger'
        }
      }
      resolver = resolve
      isOpen.value = true
    })
  }

  const handleConfirm = () => {
    isOpen.value = false
    if (resolver) {
      resolver(true)
      resolver = null
    }
  }

  const handleCancel = () => {
    isOpen.value = false
    if (resolver) {
      resolver(false)
      resolver = null
    }
  }

  return {
    isOpen,
    options,
    confirm,
    handleConfirm,
    handleCancel
  }
}
