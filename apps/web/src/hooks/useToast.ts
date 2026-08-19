import toast from 'react-hot-toast'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

export function useToast() {
  const success = (message: string, title?: string) => {
    toast.success(`${title ? title + ': ' : ''}${message}`)
  }

  const error = (message: string, title?: string) => {
    toast.error(`${title ? title + ': ' : ''}${message}`)
  }

  const warning = (message: string, title?: string) => {
    toast(`${title ? title + ': ' : ''}${message}`, { icon: '⚠️' })
  }

  const info = (message: string, title?: string) => {
    toast(`${title ? title + ': ' : ''}${message}`, { icon: 'ℹ️' })
  }

  const showSuccessToast = success
  const showErrorToast = error
  const showWarningToast = warning
  const showInfoToast = info

  const clearAllToasts = () => {
    toast.dismiss()
  }

  // Legacy support stubs
  const addToast = () => '0'
  const removeToast = () => {}
  const toasts: Toast[] = []

  return {
    toasts,
    success,
    error,
    warning,
    info,
    addToast,
    removeToast,
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    showInfoToast,
    clearAllToasts,
  }
}
