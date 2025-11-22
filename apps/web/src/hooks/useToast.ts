import toast from 'react-hot-toast'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

export function useToast() {
  const showSuccessToast = (message: string, title?: string) => {
    toast.success(`${title ? title + ': ' : ''}${message}`)
  }

  const showErrorToast = (message: string, title?: string) => {
    toast.error(`${title ? title + ': ' : ''}${message}`)
  }

  const showWarningToast = (message: string, title?: string) => {
    toast(`${title ? title + ': ' : ''}${message}`, { icon: '⚠️' })
  }

  const showInfoToast = (message: string, title?: string) => {
    toast(`${title ? title + ': ' : ''}${message}`, { icon: 'ℹ️' })
  }

  const clearAllToasts = () => {
    toast.dismiss()
  }

  // Legacy support stubs
  const addToast = () => '0'
  const removeToast = () => {}
  const toasts: Toast[] = []

  return {
    toasts,
    addToast,
    removeToast,
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    showInfoToast,
    clearAllToasts,
  }
}
