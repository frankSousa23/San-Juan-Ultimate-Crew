import { useState, useCallback } from 'react'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }
    
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showSuccessToast = useCallback((message: string, title = 'Éxito') => {
    return addToast({
      type: 'success',
      title,
      message,
    })
  }, [addToast])

  const showErrorToast = useCallback((message: string, title = 'Error') => {
    return addToast({
      type: 'error',
      title,
      message,
    })
  }, [addToast])

  const showWarningToast = useCallback((message: string, title = 'Advertencia') => {
    return addToast({
      type: 'warning',
      title,
      message,
    })
  }, [addToast])

  const showInfoToast = useCallback((message: string, title = 'Información') => {
    return addToast({
      type: 'info',
      title,
      message,
    })
  }, [addToast])

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

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
